/**
 * src/lib/seo/crawler.js — client-side, same-origin crawler.
 *
 * Runs entirely in the admin's browser. It fetches the site's own pages,
 * parses them read-only with DOMParser, follows internal links breadth-first,
 * and reads robots.txt + sitemap.xml.
 *
 * HONEST BROWSER LIMITS (surfaced in the UI, never faked):
 *  - Only the SAME ORIGIN as the admin page is crawled. This is the one real
 *    SSRF-style guard available client-side: we never fetch another host.
 *  - fetch() follows redirects transparently, so we can see the FINAL url and
 *    that a redirect happened, but not every hop in the chain.
 *  - Cross-origin (external) links return opaque responses — their status is
 *    unreadable from the browser, so they are recorded as UNVERIFIED, not as
 *    broken. Real external checking needs a backend.
 *  - Only GET is used. Forms are never submitted; nothing is mutated.
 */

import {
  OUTCOME, NON_HTML_EXT, DEFAULT_CRAWL, SITE_ORIGIN,
} from "./constants.js";
import {
  toAbsolute, normalize, sameOrigin, compilePatterns, matchesAny,
} from "./url.js";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// ── FETCH ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = now();
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const responseTimeMs = now() - t0;
    return { res, responseTimeMs };
  } finally {
    clearTimeout(t);
  }
}

/** Fetch one page and return a raw transport result (not yet parsed). */
export async function fetchPage(url, timeoutMs) {
  try {
    const { res, responseTimeMs } = await fetchWithTimeout(url, timeoutMs);
    const contentType = res.headers.get("content-type") || "";
    const xRobots = (res.headers.get("x-robots-tag") || "").toLowerCase();
    let html = "";
    if (/text\/html|xml/i.test(contentType)) {
      html = await res.text();
    }
    return {
      url,
      finalUrl: res.url || url,
      redirected: !!res.redirected,
      status: res.status,
      ok: res.ok,
      contentType,
      xRobotsNoindex: /noindex/.test(xRobots),
      responseTimeMs,
      html,
      outcome: res.ok ? OUTCOME.SUCCESS : OUTCOME.FAILED,
      error: null,
    };
  } catch (e) {
    const aborted = e && (e.name === "AbortError" || /abort/i.test(e.message || ""));
    return {
      url, finalUrl: url, redirected: false, status: 0, ok: false,
      contentType: "", xRobotsNoindex: false, responseTimeMs: null, html: "",
      outcome: aborted ? OUTCOME.TIMEOUT : OUTCOME.FAILED,
      error: aborted ? "Request timed out" : (e.message || "Network error"),
    };
  }
}

// ── PARSE ───────────────────────────────────────────────────────────────

function textOf(el) {
  return (el?.textContent || "").replace(/\s+/g, " ").trim();
}

/** Parse fetched HTML into a page snapshot. Read-only; nothing is rendered. */
export function parseHtml(transport, origin) {
  const base = transport.finalUrl || transport.url;
  const snap = {
    url: transport.url,
    finalUrl: transport.finalUrl,
    status: transport.status,
    redirected: transport.redirected,
    redirectedTo: transport.redirected ? transport.finalUrl : null,
    contentType: transport.contentType,
    responseTimeMs: transport.responseTimeMs,
    xRobotsNoindex: transport.xRobotsNoindex,
    outcome: transport.outcome,
    error: transport.error,
    parsed: false,
    title: "", titleLen: 0,
    metaDescription: "", descLen: 0,
    canonical: "", canonicalOffHost: false,
    robotsMeta: "", metaRobotsNoindex: false,
    viewport: "", lang: "", charset: "",
    og: { title: "", description: "", image: "", url: "", type: "" },
    h1: [], headings: [], emptyHeadings: 0, headingSeqProblem: false,
    images: [], links: [], internalLinks: [], externalLinks: [],
    jsonLd: [], hasJsonLd: false,
    wordCount: 0, paragraphs: [],
    mixedContent: [],
    pageType: classifyPageType(base, origin),
  };

  if (!transport.html || typeof window === "undefined") return snap;

  let doc;
  try {
    doc = new DOMParser().parseFromString(transport.html, "text/html");
  } catch {
    return snap;
  }
  snap.parsed = true;

  const q = (sel) => doc.querySelector(sel);
  const qa = (sel) => Array.from(doc.querySelectorAll(sel));

  snap.title = textOf(q("title"));
  snap.titleLen = snap.title.length;

  snap.metaDescription = (q('meta[name="description"]')?.getAttribute("content") || "").trim();
  snap.descLen = snap.metaDescription.length;

  const canEl = q('link[rel="canonical"]');
  if (canEl) {
    const abs = toAbsolute(canEl.getAttribute("href"), base);
    if (abs) {
      snap.canonical = abs.href;
      snap.canonicalOffHost = abs.origin !== origin;
    }
  }

  snap.robotsMeta = (q('meta[name="robots"]')?.getAttribute("content") || "").trim();
  snap.metaRobotsNoindex = /noindex/i.test(snap.robotsMeta);
  snap.viewport = (q('meta[name="viewport"]')?.getAttribute("content") || "").trim();
  snap.lang = (doc.documentElement?.getAttribute("lang") || "").trim();
  snap.charset =
    (q("meta[charset]")?.getAttribute("charset") ||
      q('meta[http-equiv="Content-Type"]')?.getAttribute("content") || "").trim();

  const ogGet = (p) => (q(`meta[property="${p}"]`)?.getAttribute("content") || "").trim();
  snap.og = {
    title: ogGet("og:title"), description: ogGet("og:description"),
    image: ogGet("og:image"), url: ogGet("og:url"), type: ogGet("og:type"),
  };

  // Headings
  let lastLevel = 0;
  qa("h1,h2,h3,h4,h5,h6").forEach((h) => {
    const level = Number(h.tagName[1]);
    const text = textOf(h);
    snap.headings.push({ tag: h.tagName, level, text });
    if (!text) snap.emptyHeadings++;
    if (level === 1) snap.h1.push(text);
    if (lastLevel && level > lastLevel + 1) snap.headingSeqProblem = true;
    lastLevel = level;
  });

  // Images
  snap.images = qa("img").map((img) => {
    const altAttr = img.getAttribute("alt");
    return {
      src: img.getAttribute("src") || "",
      alt: (altAttr || "").trim(),
      decorative: altAttr === "", // explicit empty alt = decorative, not "missing"
      width: img.getAttribute("width") || "",
      height: img.getAttribute("height") || "",
    };
  });

  // Links
  qa("a[href]").forEach((a) => {
    const raw = a.getAttribute("href") || "";
    const abs = toAbsolute(raw, base);
    const link = {
      href: raw,
      abs: abs ? abs.href : "",
      text: textOf(a) || (a.getAttribute("aria-label") || "").trim(),
      rel: (a.getAttribute("rel") || "").trim(),
      internal: abs ? sameOrigin(abs, origin) : false,
    };
    snap.links.push(link);
    if (abs && link.internal) snap.internalLinks.push(normalize(abs));
    else if (abs) snap.externalLinks.push(abs.href);
  });

  // JSON-LD
  qa('script[type="application/ld+json"]').forEach((s) => {
    try {
      const data = JSON.parse(s.textContent || "{}");
      const arr = Array.isArray(data) ? data : [data];
      arr.forEach((d) => { if (d && d["@type"]) snap.jsonLd.push(d["@type"]); });
    } catch { /* malformed JSON-LD — ignore */ }
  });
  snap.hasJsonLd = snap.jsonLd.length > 0;

  // Content: word count + paragraph sizes
  qa("script,style,noscript,template").forEach((n) => n.remove());
  const bodyText = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  snap.wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
  snap.paragraphs = qa("p,li,blockquote")
    .map((p) => textOf(p))
    .filter(Boolean)
    .map((t) => t.split(/\s+/).filter(Boolean).length);

  // Mixed content (only if the page itself is https)
  if (/^https:/i.test(base)) {
    qa("[src],[href]").forEach((el) => {
      const v = el.getAttribute("src") || el.getAttribute("href") || "";
      if (/^http:\/\//i.test(v)) snap.mixedContent.push(v);
    });
  }

  if (transport.ok) snap.outcome = OUTCOME.SUCCESS; // issue-count applied later
  return snap;
}

function classifyPageType(url, origin) {
  let path = "/";
  try { path = new URL(url, origin).pathname; } catch { /* keep default */ }
  if (path === "/" || path === "") return "home";
  if (/^\/blogs\/.+/.test(path)) return "blog";
  if (path === "/blogs") return "listing";
  if (/^\/p\/.+/.test(path)) return "custom-page";
  if (/^\/(about|contact|contact-us|fleet|offers|outstation|terms|privacy|cancellation)/.test(path))
    return "main";
  return "other";
}

// ── ROBOTS + SITEMAP ──────────────────────────────────────────────────────

export async function fetchRobots(origin, timeoutMs) {
  const url = `${origin}/robots.txt`;
  const r = await fetchPageText(url, timeoutMs);
  const out = { url, found: false, text: "", sitemaps: [], disallow: [] };
  if (!r.ok || !r.text) return out;
  out.found = true;
  out.text = r.text;
  r.text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*sitemap:\s*(\S+)/i);
    if (m) out.sitemaps.push(m[1].trim());
    const d = line.match(/^\s*disallow:\s*(\S*)/i);
    if (d && d[1]) out.disallow.push(d[1].trim());
  });
  return out;
}

async function fetchPageText(url, timeoutMs) {
  try {
    const { res } = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) return { ok: false, text: "" };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false, text: "" };
  }
}

/** Discover + parse sitemaps (index files are followed, depth-limited). */
export async function discoverSitemaps(origin, extra, robotsSitemaps, timeoutMs) {
  const seen = new Set();
  const urls = new Set();
  const found = [];
  const queue = [
    ...(robotsSitemaps || []),
    ...(extra || []),
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ].filter(Boolean);

  let guard = 0;
  while (queue.length && guard < 50) {
    guard++;
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const r = await fetchPageText(sm, timeoutMs);
    if (!r.ok || !r.text) continue;
    let xml;
    try { xml = new DOMParser().parseFromString(r.text, "application/xml"); }
    catch { continue; }
    if (xml.querySelector("parsererror")) continue;
    found.push(sm);

    // Sitemap index → enqueue child sitemaps
    xml.querySelectorAll("sitemap > loc").forEach((loc) => {
      const u = textOf(loc);
      if (u && !seen.has(u)) queue.push(u);
    });
    // URL set → collect page URLs (same origin only)
    xml.querySelectorAll("url > loc").forEach((loc) => {
      const abs = toAbsolute(textOf(loc), origin);
      if (abs && abs.origin === origin) urls.add(normalize(abs));
    });
  }
  return { urls, found };
}

// ── CRAWL ──────────────────────────────────────────────────────────────────

/**
 * @param {object}   cfg      { origin, startUrls[], sitemapUrls[], include[], exclude[], ...DEFAULT_CRAWL }
 * @param {object}   hooks    { onProgress(fn), token:{cancelled} }
 */
export async function crawl(cfg, hooks = {}) {
  const config = { ...DEFAULT_CRAWL, ...cfg };
  const origin = config.origin || (typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN);
  const token = hooks.token || { cancelled: false };
  const onProgress = hooks.onProgress || (() => {});
  const include = compilePatterns(config.include);
  const exclude = compilePatterns(config.exclude);

  const startedAt = new Date().toISOString();
  const t0 = now();

  // 1) discovery
  const robots = await fetchRobots(origin, config.perRequestTimeoutMs);
  const sitemap = await discoverSitemaps(origin, config.sitemapUrls, robots.sitemaps, config.perRequestTimeoutMs);

  const seeds = new Set();
  seeds.add(normalize(new URL(origin)));
  (config.startUrls || []).forEach((u) => {
    const abs = toAbsolute(u, origin);
    if (abs && abs.origin === origin) seeds.add(normalize(abs));
  });
  sitemap.urls.forEach((u) => seeds.add(u));

  // 2) BFS
  const results = new Map();          // key -> snapshot (+ meta)
  const depthOf = new Map();
  const linkGraph = new Map();        // targetKey -> Set(sourceKey)
  const externalMap = new Map();      // extHref -> Set(sourceKey)
  const queued = new Set();
  const discovered = new Set(seeds);
  let queue = [];

  const eligible = (key) => {
    if (NON_HTML_EXT.test(key)) return false;
    if (include.length && !matchesAny(key, include)) return false;
    if (exclude.length && matchesAny(key, exclude)) return false;
    return true;
  };

  for (const s of seeds) {
    depthOf.set(s, 0);
    if (eligible(s)) { queue.push(s); queued.add(s); }
  }

  let stopReason = "completed";
  let checked = 0;

  const processOne = async (key) => {
    if (token.cancelled) return;
    const depth = depthOf.get(key) ?? 0;
    const transport = await fetchPage(key, config.perRequestTimeoutMs);
    const snap = parseHtml(transport, origin);
    // attach per-page findings → finalize outcome
    snap.depth = depth;
    results.set(key, snap);
    checked++;

    // record outbound internal links into the graph + enqueue new ones
    for (const target of snap.internalLinks || []) {
      if (!linkGraph.has(target)) linkGraph.set(target, new Set());
      linkGraph.get(target).add(key);
      discovered.add(target);
      if (
        !queued.has(target) && !results.has(target) &&
        eligible(target) && depth + 1 <= config.maxDepth
      ) {
        depthOf.set(target, depth + 1);
        queue.push(target);
        queued.add(target);
      }
    }
    for (const ext of snap.externalLinks || []) {
      if (!externalMap.has(ext)) externalMap.set(ext, new Set());
      externalMap.get(ext).add(key);
    }
    onProgress({
      checked, discovered: discovered.size, queued: queue.length,
      current: key, maxPages: config.maxPages,
    });
  };

  // concurrency-limited drain, respecting maxPages
  while (queue.length && !token.cancelled) {
    if (checked >= config.maxPages) { stopReason = "maxPages"; break; }
    const batch = [];
    while (queue.length && batch.length < config.concurrency && checked + batch.length < config.maxPages) {
      batch.push(queue.shift());
    }
    await Promise.all(batch.map(processOne));
    if (config.politenessDelayMs) await new Promise((r) => setTimeout(r, config.politenessDelayMs));
  }
  if (token.cancelled) stopReason = "cancelled";

  // 3) mark URLs discovered-but-not-checked
  const skipped = [];
  for (const key of discovered) {
    if (!results.has(key)) {
      const reason = !eligible(key)
        ? (matchesAny(key, exclude) ? OUTCOME.BLOCKED : (NON_HTML_EXT.test(key) ? OUTCOME.SKIPPED : OUTCOME.BLOCKED))
        : OUTCOME.SKIPPED; // limit reached
      skipped.push({ url: key, outcome: reason });
    }
  }

  const finishedAt = new Date().toISOString();
  const partial = stopReason !== "completed";

  return {
    origin, config, startedAt, finishedAt, durationMs: Math.round(now() - t0),
    robots, sitemap,
    results, linkGraph, externalMap,
    skipped, discovered,
    partial, stopReason,
    counts: { checked, discovered: discovered.size, skipped: skipped.length },
  };
}
