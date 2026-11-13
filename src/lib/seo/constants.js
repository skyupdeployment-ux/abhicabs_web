/**
 * src/lib/seo/constants.js
 *
 * Single source of truth for the client-side SEO toolkit:
 *   - the canonical public origin of the site,
 *   - the severity + category model shared by the editor analyzer and the
 *     full-site crawler, so the same rule produces the same label everywhere
 *     (this is what lets the Improvement Center group a shared-template issue
 *     across N pages instead of emitting N unrelated alerts), and
 *   - the thresholds, exposed as plain config so they read as guidelines
 *     rather than hard ranking rules (per the spec's caution on length/density).
 *
 * No React, no DOM, no network — safe to import from anywhere, SSR included.
 */

// Canonical public origin. Matches pages/+Head.jsx (SITE) and public/sitemap.xml.
// The old `www.abhicabs.in` strings elsewhere were stale and caused the SERP
// preview + blog canonical/OG to point at the wrong host.
export const SITE_ORIGIN = "https://www.abhicabs24x7.com";

// Severity model. Order matters — it drives sort/priority.
export const SEVERITY = {
  critical:   { rank: 5, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Critical" },
  error:      { rank: 4, color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", label: "Error" },
  warning:    { rank: 3, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Warning" },
  suggestion: { rank: 2, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Suggestion" },
  info:       { rank: 1, color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", label: "Info" },
  pass:       { rank: 0, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Pass" },
};

export const CATEGORY = {
  metadata:     { label: "Metadata" },
  content:      { label: "Content" },
  headings:     { label: "Headings" },
  images:       { label: "Images" },
  links:        { label: "Links" },
  technical:    { label: "Technical" },
  indexability: { label: "Indexing" },
  structure:    { label: "Structure" },
  performance:  { label: "Performance" },
};

// Per-URL terminal outcomes (spec §5). Every crawled URL ends on exactly one.
export const OUTCOME = {
  SUCCESS:      "SUCCESS",       // fetched, parsed, no issues
  ISSUES_FOUND: "ISSUES_FOUND",  // fetched, parsed, issues present
  BLOCKED:      "BLOCKED",       // disallowed by robots / excluded by config
  TIMEOUT:      "TIMEOUT",       // request exceeded the per-request timeout
  FAILED:       "FAILED",        // network/HTTP error (4xx/5xx/connection)
  SKIPPED:      "SKIPPED",       // not fetched because a crawl limit was hit
  UNVERIFIED:   "UNVERIFIED",    // cross-origin / opaque — cannot be confirmed
};

// Thresholds — guidelines, configurable, NOT guarantees of ranking.
export const THRESHOLDS = {
  titleMin: 30, titleIdealMax: 60, titleHardMax: 70,
  descMin: 70, descIdealMax: 160,
  slugHardMax: 75,
  thinContentWords: 300,
  longParagraphWords: 150,
  longSentenceWords: 25,
  keywordDensityMax: 3, // %
};

// Default crawl configuration. All caps are enforced by the crawler so a run
// can never hammer the site or spin forever.
export const DEFAULT_CRAWL = {
  maxPages: 150,
  maxDepth: 6,
  concurrency: 4,
  perRequestTimeoutMs: 15000,
  politenessDelayMs: 120, // small gap between request batches
  checkExternalLinks: false, // browser can't read cross-origin responses anyway
};

// File extensions that are resources, not crawlable HTML pages.
export const NON_HTML_EXT =
  /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|pdf|zip|rar|gz|mp4|webm|mp3|wav|css|js|mjs|json|xml|txt|woff2?|ttf|eot|csv|doc|docx|xls|xlsx|ppt|pptx)(\?|#|$)/i;

export function sevRank(sev) {
  return (SEVERITY[sev] || SEVERITY.info).rank;
}
