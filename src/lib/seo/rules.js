/**
 * src/lib/seo/rules.js
 *
 * Deterministic, evidence-based page rules. Input is a parsed page snapshot
 * (see crawler.parseHtml); output is a flat list of findings. Each finding
 * carries a STABLE ruleId so the same problem on many pages groups into one
 * shared-template recommendation downstream (spec §8, §13).
 *
 * Every finding states what was observed (evidence) and what to do
 * (recommendation). Nothing here is speculative; AI-style suggestions live in
 * a separate, clearly-labelled layer and are not part of this engine.
 */

import { THRESHOLDS } from "./constants.js";

const T = THRESHOLDS;

/**
 * @param {object} page  parsed snapshot
 * @returns {Array<{ruleId,category,severity,title,evidence,impact,recommendation}>}
 */
export function analyzePage(page) {
  const out = [];
  const add = (ruleId, category, severity, title, evidence, impact, recommendation) =>
    out.push({ ruleId, category, severity, title, evidence, impact, recommendation });

  // ── TRANSPORT / TECHNICAL ──────────────────────────────────────────────
  if (page.status >= 500) {
    add("http-5xx", "technical", "critical", "Server error",
      `HTTP ${page.status} at ${page.finalUrl || page.url}`,
      "The page is unavailable to users and search engines.",
      "Fix the server error so the page returns 200.");
  } else if (page.status >= 400) {
    add("http-4xx", "technical", "error", `Broken page (HTTP ${page.status})`,
      `HTTP ${page.status} at ${page.finalUrl || page.url}`,
      "The URL is dead; any link or sitemap entry pointing here is broken.",
      "Restore the page or 301-redirect the URL to a relevant live page.");
  }

  if (page.redirected && page.redirectedTo) {
    add("redirect", "technical", "warning", "URL redirects",
      `${page.url} → ${page.redirectedTo}`,
      "Redirected URLs waste crawl budget and dilute link equity if linked internally.",
      "Point internal links and the sitemap at the final URL directly.");
  }

  if (page.responseTimeMs != null && page.responseTimeMs > 3000) {
    add("slow-response", "performance", "warning", "Slow server response",
      `First byte took ${Math.round(page.responseTimeMs)} ms`,
      "Slow responses hurt crawl efficiency and user experience.",
      "Investigate server/render time for this route (full field metrics need PageSpeed, which is a backend integration).");
  }

  if (page.contentType && !/text\/html/i.test(page.contentType)) {
    add("content-type", "technical", "info", "Non-HTML content type",
      `Content-Type: ${page.contentType}`,
      "Only HTML pages are analysed for on-page SEO.",
      "Confirm this URL is meant to be an indexable HTML page.");
  }

  // A failed or unparsed URL gets only the transport-level findings above —
  // running "missing meta description" etc. on a 404 or a timeout is noise.
  if (page.status === 0 || page.status >= 400 || !page.parsed) return out;

  // ── INDEXABILITY ───────────────────────────────────────────────────────
  if (page.metaRobotsNoindex || page.xRobotsNoindex) {
    add("noindex", "indexability", "warning", "Page is set to noindex",
      page.metaRobotsNoindex ? `meta robots: "${page.robotsMeta}"` : "X-Robots-Tag: noindex",
      "This page will be kept out of search results.",
      "Remove noindex if the page is meant to rank. Crawlability and indexability are separate — confirm this is intentional.");
  }

  // ── METADATA: TITLE ────────────────────────────────────────────────────
  if (!page.title) {
    add("title-missing", "metadata", "error", "Missing <title>",
      "No <title> element or it is empty.",
      "Titles are the primary clickable element in search results.",
      "Add a descriptive, unique title.");
  } else {
    if (page.titleLen > T.titleHardMax)
      add("title-long", "metadata", "suggestion", "Title likely truncated",
        `${page.titleLen} characters: "${page.title}"`,
        "Long titles get cut off in results (~60 chars shown).",
        `Trim toward ${T.titleIdealMax} characters.`);
    else if (page.titleLen < T.titleMin)
      add("title-short", "metadata", "suggestion", "Very short title",
        `${page.titleLen} characters: "${page.title}"`,
        "Short titles leave relevance and click-through on the table.",
        `Expand toward ${T.titleIdealMax} characters.`);
  }

  // ── METADATA: DESCRIPTION ──────────────────────────────────────────────
  if (!page.metaDescription) {
    add("desc-missing", "metadata", "warning", "Missing meta description",
      "No meta description tag.",
      "Google will auto-generate a snippet, often poorly.",
      `Write a ${T.descMin}-${T.descIdealMax} character description.`);
  } else if (page.descLen > T.descIdealMax) {
    add("desc-long", "metadata", "suggestion", "Meta description long",
      `${page.descLen} characters.`,
      "Descriptions beyond ~155 chars get truncated.",
      `Trim toward ${T.descIdealMax} characters.`);
  } else if (page.descLen < T.descMin) {
    add("desc-short", "metadata", "suggestion", "Meta description short",
      `${page.descLen} characters.`,
      "Short descriptions waste snippet space.",
      `Expand toward ${T.descMin}-${T.descIdealMax} characters.`);
  }

  // ── METADATA: CANONICAL ────────────────────────────────────────────────
  if (!page.canonical) {
    add("canonical-missing", "metadata", "suggestion", "No canonical tag",
      "No <link rel=\"canonical\">.",
      "Without a canonical, duplicate URL variants can compete.",
      "Add a self-referencing canonical to the preferred URL.");
  } else if (page.canonicalOffHost) {
    add("canonical-offhost", "metadata", "warning", "Canonical points to another host",
      `canonical: ${page.canonical}`,
      "An off-host canonical can de-index this page in favour of the other host.",
      "Confirm the canonical host is correct (should match the live domain).");
  }

  // ── METADATA: OPEN GRAPH ───────────────────────────────────────────────
  if (!page.og || !page.og.title || !page.og.image) {
    add("og-incomplete", "metadata", "suggestion", "Open Graph incomplete",
      `og:title ${page.og?.title ? "set" : "missing"}, og:image ${page.og?.image ? "set" : "missing"}`,
      "Missing OG tags produce poor link previews on social/WhatsApp.",
      "Set og:title, og:description and og:image.");
  }

  // ── HEADINGS ───────────────────────────────────────────────────────────
  const h1n = (page.h1 || []).length;
  if (h1n === 0)
    add("h1-missing", "headings", "warning", "No H1 heading",
      "The page has no H1.",
      "The H1 signals the page's primary topic.",
      "Add a single, descriptive H1.");
  else if (h1n > 1)
    add("h1-multiple", "headings", "suggestion", `${h1n} H1 headings`,
      `Found ${h1n} H1 elements.`,
      "Multiple H1s muddy the topical signal.",
      "Use one H1; demote the rest to H2.");

  if (page.emptyHeadings > 0)
    add("heading-empty", "headings", "warning", `${page.emptyHeadings} empty heading(s)`,
      `${page.emptyHeadings} heading element(s) have no text.`,
      "Empty headings break document structure and accessibility.",
      "Remove or fill empty headings.");

  if (page.headingSeqProblem)
    add("heading-seq", "headings", "suggestion", "Heading levels skip",
      "Heading levels jump (e.g. H2 → H4).",
      "Skipped levels weaken outline semantics.",
      "Keep heading levels sequential.");

  // ── CONTENT ────────────────────────────────────────────────────────────
  if (page.wordCount === 0) {
    add("content-empty", "content", "warning", "No readable text",
      "The rendered page has no extractable body text.",
      "Thin/empty pages rarely rank and may be treated as low value.",
      "Add meaningful content, or confirm the page needs indexing at all.");
  } else if (page.wordCount < T.thinContentWords) {
    add("content-thin", "content", "suggestion", "Thin content",
      `~${page.wordCount} words.`,
      "Shallow coverage limits relevance for competitive queries.",
      `Expand past ${T.thinContentWords} words where it adds real value (length alone is not a ranking factor).`);
  }

  const longParas = (page.paragraphs || []).filter((w) => w > T.longParagraphWords).length;
  if (longParas > 0)
    add("content-long-paras", "content", "info", `${longParas} long paragraph(s)`,
      `${longParas} paragraph(s) exceed ${T.longParagraphWords} words.`,
      "Dense blocks hurt readability.",
      "Break long paragraphs into 3-5 sentence chunks.");

  // ── IMAGES ─────────────────────────────────────────────────────────────
  const imgs = page.images || [];
  const missingAlt = imgs.filter((i) => !i.alt && !i.decorative).length;
  if (missingAlt > 0)
    add("img-alt", "images", "warning", `${missingAlt} image(s) missing alt text`,
      `${missingAlt} of ${imgs.length} <img> have no alt attribute.`,
      "Alt text aids accessibility and image search.",
      "Add descriptive alt text (leave alt=\"\" only for decorative images).");

  // ── LINKS ──────────────────────────────────────────────────────────────
  const emptyAnchors = (page.links || []).filter((l) => l.abs && !l.text).length;
  if (emptyAnchors > 0)
    add("link-empty-anchor", "links", "suggestion", `${emptyAnchors} link(s) with no anchor text`,
      `${emptyAnchors} link(s) have empty/whitespace anchor text.`,
      "Anchorless links give users and crawlers no context.",
      "Add descriptive, visible anchor text (icons need aria-label).");

  // ── TECHNICAL: VIEWPORT / LANG / MIXED CONTENT ─────────────────────────
  if (!page.viewport)
    add("viewport-missing", "technical", "warning", "No mobile viewport",
      "No <meta name=\"viewport\"> tag.",
      "Pages without a viewport render poorly on mobile.",
      "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.");

  if (!page.lang)
    add("lang-missing", "technical", "info", "No <html lang>",
      "The html element has no lang attribute.",
      "Language metadata helps search engines and screen readers.",
      "Set <html lang=\"en\"> (or the correct locale).");

  if ((page.mixedContent || []).length > 0)
    add("mixed-content", "technical", "error", "Mixed content",
      `${page.mixedContent.length} http:// resource(s) on an https page.`,
      "Mixed content is blocked by browsers and flags the page as insecure.",
      "Load all resources over https.");

  // ── STRUCTURE: JSON-LD ─────────────────────────────────────────────────
  if (!page.hasJsonLd)
    add("jsonld-missing", "structure", "suggestion", "No structured data",
      "No JSON-LD found on the page.",
      "Structured data unlocks rich results (FAQ, Breadcrumb, Article…).",
      "Add relevant schema.org JSON-LD for this page type.");

  return out;
}
