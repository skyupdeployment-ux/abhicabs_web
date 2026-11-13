/**
 * Blog helpers — pure functions over the REAL post shape written by the Blog Builder
 * ({ id, slug, category, title, headline, description, date, author, image, heroImage,
 *    tags[], sections[], schemas }). Nothing here invents data: anything the CMS doesn't
 * provide (views, featured flags, authors…) simply isn't shown.
 *
 * Editorial flags use the builder's existing Tags field — no schema change:
 *   featured                      → the Featured Story
 *   popular                       → "Popular Reads" (editor-selected, NOT view counts)
 *   destination | destinations    → Destination Guides
 *   tips | travel-tips            → Travel Tips
 *   route | routes                → Popular Routes   (+ optional  from:Bangalore  to:Mysore)
 */
export const slugify = (str = "") =>
  String(str).toLowerCase().trim().replace(/["“”‘’'`]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export const blogUrl = (b) => `/blogs/${b.slug}`;
export const categorySlug = (c) => slugify(c || "uncategorized");
export const titleOf = (b) => b.headline || b.title || "";
export const imageOf = (b) => b.heroImage || b.image || b.coverImage || "";

const tagList = (b) => (Array.isArray(b.tags) ? b.tags : String(b.tags || "").split(",")).map((t) => String(t).trim().toLowerCase()).filter(Boolean);
export const hasTag = (b, ...names) => { const t = tagList(b); return names.some((n) => t.includes(n)); };
const tagValue = (b, key) => (tagList(b).find((t) => t.startsWith(key + ":")) || "").slice(key.length + 1).trim();

export const isFeatured = (b) => hasTag(b, "featured");
export const isPopular = (b) => hasTag(b, "popular");
export const isDestination = (b) => hasTag(b, "destination", "destinations") || /destination/i.test(b.category || "");
export const isTip = (b) => hasTag(b, "tips", "tip", "travel-tips") || /tip/i.test(b.category || "");
export const isRoute = (b) => hasTag(b, "route", "routes");

/** Verified route endpoints come ONLY from explicit from:/to: tags. */
export function routeEndpoints(b) {
  const title = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const from = tagValue(b, "from"), to = tagValue(b, "to");
  return from && to ? { from: title(from), to: title(to) } : null;
}

export function parseDate(d) {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t);
}
export function formatDate(d) {
  const dt = parseDate(d);
  return dt ? dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : (d || "");
}

/** Plain text of an article (for search + reading time). */
export function plainText(b) {
  const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  return (b.sections || []).map((s) => {
    if (Array.isArray(s.text)) return s.text.map(strip).join(" ");
    if (Array.isArray(s.items)) return s.items.map((i) => `${i.question || ""} ${i.answer || ""}`).join(" ");
    return strip(s.text);
  }).join(" ");
}
/** Reading time computed from the real article text (≈200 wpm); null when there's no body. */
export function readingMinutes(b) {
  const words = plainText(b).split(/\s+/).filter(Boolean).length;
  return words >= 60 ? Math.max(1, Math.round(words / 200)) : null;
}

/** Newest first: by date, then by id. */
export function sortBlogs(list) {
  return [...list].sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? 0, db = parseDate(b.date)?.getTime() ?? 0;
    if (da !== db) return db - da;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

/** Categories that actually contain articles, with counts. */
export function categoriesOf(list) {
  const map = new Map();
  list.forEach((b) => { const c = b.category || "Uncategorized"; map.set(c, (map.get(c) || 0) + 1); });
  return [...map.entries()].map(([name, count]) => ({ name, slug: categorySlug(name), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Category + search together (title, description, tags, category, body). */
export function filterBlogs(list, { category = "", q = "" } = {}) {
  const query = q.trim().toLowerCase();
  return list.filter((b) => {
    if (category && categorySlug(b.category) !== category) return false;
    if (!query) return true;
    const hay = [titleOf(b), b.title, b.description, b.category, tagList(b).join(" "), plainText(b)].join(" ").toLowerCase();
    return query.split(/\s+/).every((w) => hay.includes(w));
  });
}

export const paginate = (list, page, perPage) => {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page), pages);
  return { items: list.slice((current - 1) * perPage, current * perPage), page: current, pages, total: list.length };
};

/** Related = same category first, then shared tags. */
export function relatedBlogs(blog, all, n = 3) {
  const mine = new Set(tagList(blog));
  return all.filter((b) => b.slug !== blog.slug)
    .map((b) => ({ b, score: (b.category === blog.category ? 3 : 0) + tagList(b).filter((t) => mine.has(t) && !["featured", "popular"].includes(t)).length }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.b);
}
/** Previous / next in the real (newest-first) ordering: "next" = the newer one. */
export function neighbours(blog, sorted) {
  const i = sorted.findIndex((b) => b.slug === blog.slug);
  return { newer: i > 0 ? sorted[i - 1] : null, older: i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : null };
}
