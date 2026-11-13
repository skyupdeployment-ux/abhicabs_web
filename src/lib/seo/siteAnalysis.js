/**
 * src/lib/seo/siteAnalysis.js
 *
 * Turns a raw crawl into an audit: runs the deterministic page rules on every
 * fetched page, then derives the site-wide picture — duplicate metadata,
 * broken/redirecting internal links WITH their source pages, shared-template
 * groupings, sitemap-vs-crawl differences, orphan indicators, coverage, and a
 * prioritized Improvement Center.
 *
 * Nothing here invents data. Where the browser can't confirm something
 * (external links), it is reported as UNVERIFIED, not as a failure.
 */

import { analyzePage } from "./rules.js";
import { OUTCOME, SEVERITY, sevRank } from "./constants.js";

export function buildAudit(crawl) {
  const pages = Array.from(crawl.results.values());

  // 1) per-page findings + outcome finalization + inventory
  const pageIssues = [];
  const urlInventory = [];
  const severityCounts = { critical: 0, error: 0, warning: 0, suggestion: 0, info: 0 };
  let successCount = 0, issuesCount = 0, failedCount = 0, timeoutCount = 0;

  for (const p of pages) {
    const findings = analyzePage(p); // self-limits to transport findings on failed/unparsed URLs
    const real = findings.filter((f) => f.severity !== "pass");
    real.forEach((f) => { if (severityCounts[f.severity] != null) severityCounts[f.severity]++; });

    let outcome = p.outcome;
    if (p.outcome === OUTCOME.TIMEOUT) { outcome = OUTCOME.TIMEOUT; timeoutCount++; }
    else if (p.status >= 400 || p.status === 0) { outcome = OUTCOME.FAILED; failedCount++; }
    else if (real.length) { outcome = OUTCOME.ISSUES_FOUND; issuesCount++; }
    else { outcome = OUTCOME.SUCCESS; successCount++; }

    pageIssues.push({ url: p.url, pageType: p.pageType, findings: real });
    urlInventory.push({
      url: p.url, finalUrl: p.finalUrl, status: p.status, outcome,
      redirected: p.redirected, redirectedTo: p.redirectedTo, pageType: p.pageType,
      issueCount: real.length, responseTimeMs: p.responseTimeMs != null ? Math.round(p.responseTimeMs) : null,
      canonical: p.canonical, noindex: p.metaRobotsNoindex || p.xRobotsNoindex,
      title: p.title, metaDescription: p.metaDescription, error: p.error,
    });
  }

  // 2) shared-template grouping (same ruleId across pages)
  const groupMap = new Map();
  for (const pi of pageIssues) {
    for (const f of pi.findings) {
      if (!groupMap.has(f.ruleId)) {
        groupMap.set(f.ruleId, {
          ruleId: f.ruleId, category: f.category, severity: f.severity,
          title: f.title, impact: f.impact, recommendation: f.recommendation,
          urls: [], sampleEvidence: f.evidence,
        });
      }
      groupMap.get(f.ruleId).urls.push(pi.url);
    }
  }
  const groups = Array.from(groupMap.values())
    .map((g) => ({ ...g, count: g.urls.length }))
    .sort((a, b) => sevRank(b.severity) - sevRank(a.severity) || b.count - a.count);

  // 3) broken + redirecting internal links, with source pages
  const brokenInternal = [];
  const redirectingInternal = [];
  for (const [target, sources] of crawl.linkGraph.entries()) {
    const hit = crawl.results.get(target);
    if (!hit) continue; // target wasn't crawled (skipped/limit) — not "broken"
    if (hit.status >= 400 || hit.status === 0) {
      brokenInternal.push({ target, status: hit.status, outcome: hit.outcome, sources: Array.from(sources) });
    } else if (hit.redirected && hit.redirectedTo && hit.redirectedTo !== target) {
      redirectingInternal.push({ target, finalUrl: hit.redirectedTo, sources: Array.from(sources) });
    }
  }

  // 4) duplicate metadata
  const titleMap = new Map();
  const descMap = new Map();
  for (const u of urlInventory) {
    if (u.title) addToBucket(titleMap, u.title.toLowerCase(), u.url);
    if (u.metaDescription) addToBucket(descMap, u.metaDescription.toLowerCase(), u.url);
  }
  const duplicates = {
    titles: bucketDupes(titleMap),
    descriptions: bucketDupes(descMap),
  };

  // 5) sitemap vs crawl diff
  const crawledKeys = new Set(pages.map((p) => p.url));
  const sitemapKeys = crawl.sitemap.urls; // Set of normalized
  const inSitemapNotCrawled = [];
  for (const u of sitemapKeys) if (!crawledKeys.has(u)) inSitemapNotCrawled.push(u);
  const crawledNotInSitemap = [];
  for (const k of crawledKeys) if (!sitemapKeys.has(k)) crawledNotInSitemap.push(k);
  const sitemapDiff = { inSitemapNotCrawled, crawledNotInSitemap };

  // 6) orphan indicators (crawled, reachable only as a seed, 0 inbound links)
  const orphans = [];
  for (const p of pages) {
    if (p.pageType === "home") continue;
    const inbound = crawl.linkGraph.get(p.url);
    if (!inbound || inbound.size === 0) orphans.push(p.url);
  }

  // 7) external links (browser cannot verify)
  const external = Array.from(crawl.externalMap.entries())
    .map(([href, sources]) => ({ href, sources: Array.from(sources) }))
    .sort((a, b) => b.sources.length - a.sources.length);

  // 8) site-wide findings as first-class issues (feed the Improvement Center)
  const siteIssues = [];
  if (brokenInternal.length)
    siteIssues.push(mkSite("broken-internal", "links", "critical",
      "Broken internal links",
      `${brokenInternal.length} internal link target(s) return an error.`,
      "Broken links waste crawl budget and frustrate users.",
      "Fix or repoint each link to a live URL.",
      brokenInternal.flatMap((b) => b.sources)));
  if (redirectingInternal.length)
    siteIssues.push(mkSite("redirecting-internal", "links", "warning",
      "Internal links to redirects",
      `${redirectingInternal.length} internal link(s) hit a redirect before resolving.`,
      "Redirected internal links leak a little link equity and add latency.",
      "Point the source links at the final URL directly.",
      redirectingInternal.flatMap((r) => r.sources)));
  if (duplicates.titles.length)
    siteIssues.push(mkSite("dup-title", "metadata", "warning",
      "Duplicate titles",
      `${duplicates.titles.length} title(s) are shared by multiple pages.`,
      "Duplicate titles make pages compete and look templated in results.",
      "Give each page a unique, specific title.",
      duplicates.titles.flatMap((d) => d.urls)));
  if (duplicates.descriptions.length)
    siteIssues.push(mkSite("dup-desc", "metadata", "suggestion",
      "Duplicate meta descriptions",
      `${duplicates.descriptions.length} description(s) are reused across pages.`,
      "Reused descriptions waste snippet differentiation.",
      "Write a distinct description per page.",
      duplicates.descriptions.flatMap((d) => d.urls)));
  if (inSitemapNotCrawled.length)
    siteIssues.push(mkSite("sitemap-unreached", "indexability", "info",
      "Sitemap URLs not reached by crawl",
      `${inSitemapNotCrawled.length} sitemap URL(s) weren't reached from internal links within the crawl limits.`,
      "They may be orphaned, or simply beyond the crawl depth/page cap.",
      "Check whether these pages are linked internally; raise crawl limits to confirm.",
      inSitemapNotCrawled));
  if (orphans.length)
    siteIssues.push(mkSite("orphan", "structure", "suggestion",
      "Possible orphan pages",
      `${orphans.length} crawled page(s) had no inbound internal links in this crawl.`,
      "Orphan pages are hard for users and crawlers to find.",
      "Add internal links from relevant pages.",
      orphans));

  // 9) coverage (spec §15)
  const coverage = {
    discovered: crawl.counts.discovered,
    eligibleChecked: pages.length,
    success: successCount,
    withIssues: issuesCount,
    failed: failedCount,
    timeout: timeoutCount,
    blocked: crawl.skipped.filter((s) => s.outcome === OUTCOME.BLOCKED).length,
    skipped: crawl.skipped.filter((s) => s.outcome === OUTCOME.SKIPPED).length,
    external: external.length,
    partial: crawl.partial,
    stopReason: crawl.stopReason,
    completed: !crawl.partial,
    durationMs: crawl.durationMs,
    startedAt: crawl.startedAt,
    finishedAt: crawl.finishedAt,
    robotsFound: crawl.robots.found,
    sitemapsFound: crawl.sitemap.found,
  };

  // 10) Improvement Center — prioritized, each with the full "what/where/why" set
  const improvements = buildImprovements(groups, siteIssues);

  return {
    origin: crawl.origin,
    severityCounts,
    totalIssues: Object.values(severityCounts).reduce((a, b) => a + b, 0),
    urlInventory, pageIssues, groups, siteIssues,
    brokenInternal, redirectingInternal, duplicates, sitemapDiff, orphans, external,
    coverage,
    improvements,
    blogSummary: typeSummary(urlInventory, "blog"),
    mainSummary: typeSummary(urlInventory, "main"),
  };
}

// ── helpers ─────────────────────────────────────────────────────────────

function addToBucket(map, key, url) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(url);
}
function bucketDupes(map) {
  return Array.from(map.entries())
    .filter(([, urls]) => urls.length > 1)
    .map(([value, urls]) => ({ value, urls }));
}
function mkSite(ruleId, category, severity, title, evidence, impact, recommendation, urls) {
  return { ruleId, category, severity, title, evidence, impact, recommendation, urls: unique(urls), count: unique(urls).length };
}
function unique(arr) { return Array.from(new Set(arr || [])); }

function typeSummary(inv, type) {
  const rows = inv.filter((r) => r.pageType === type);
  return {
    total: rows.length,
    withIssues: rows.filter((r) => r.issueCount > 0).length,
    issues: rows.reduce((a, r) => a + r.issueCount, 0),
  };
}

function buildImprovements(groups, siteIssues) {
  const items = [];
  const push = (src, affected) => {
    const priority = sevRank(src.severity) * 1000 + Math.min(affected, 999);
    items.push({
      id: src.ruleId,
      title: src.title,
      category: src.category,
      severity: src.severity,
      whatIsWrong: src.title,
      affectedUrls: unique(src.urls || []),
      affectedCount: affected,
      evidence: src.sampleEvidence || src.evidence || "",
      whyItMatters: src.impact || "",
      whatToChange: src.recommendation || "",
      verifyBy: "Recheck the affected URL(s) after the fix.",
      effort: affected > 10 ? "Template fix (one change, many pages)" : affected > 1 ? "Low–medium" : "Low",
      priority,
      status: "detected",
    });
  };
  siteIssues.forEach((s) => push(s, s.count));
  groups.forEach((g) => push(g, g.count));
  return items.sort((a, b) => b.priority - a.priority);
}
