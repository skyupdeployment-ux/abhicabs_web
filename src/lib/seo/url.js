/**
 * src/lib/seo/url.js — URL normalization, classification, matching.
 *
 * Normalization is deliberately conservative: we strip the hash and normalize
 * the trailing slash, but we KEEP the query string, because query params can
 * materially change page content (spec §4.5). Two URLs that differ only by
 * hash are the same document; everything else is treated as distinct.
 */

/** Resolve `href` against `base` and return an absolute URL object, or null. */
export function toAbsolute(href, base) {
  if (!href) return null;
  const h = String(href).trim();
  if (!h || h.startsWith("#")) return null;
  if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(h)) return null;
  try {
    return new URL(h, base);
  } catch {
    return null;
  }
}

/** Canonical string form used as the dedup key. */
export function normalize(urlObj) {
  if (!urlObj) return "";
  const u = new URL(urlObj.href);
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  // Collapse a bare trailing slash on non-root paths so /x and /x/ dedupe.
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u.href;
}

export function sameOrigin(urlObj, origin) {
  try {
    return urlObj.origin === origin;
  } catch {
    return false;
  }
}

/** Compile user-supplied glob-ish patterns ("*" wildcard) to RegExp. */
export function compilePatterns(list) {
  return (list || [])
    .map((p) => String(p).trim())
    .filter(Boolean)
    .map((p) => {
      const esc = p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      try { return new RegExp(esc, "i"); } catch { return null; }
    })
    .filter(Boolean);
}

export function matchesAny(str, regexes) {
  return (regexes || []).some((r) => r.test(str));
}
