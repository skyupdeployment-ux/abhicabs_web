#!/usr/bin/env node
/**
 * generate-sitemap.js — builds public/sitemap.xml at deploy time.
 *
 * Run:  node scripts/generate-sitemap.js
 * Hook: add to package.json → "build": "node scripts/generate-sitemap.js && vike build"
 *
 * Sources:
 *   1. Static routes hardcoded below (Vike pages that always exist).
 *   2. CMS service pages fetched from the backend API.
 *   3. Published blog posts fetched from GitHub (src/data/blogs.js + seoArticles.js).
 *
 * Works on any platform — no Vercel, no serverless, no runtime dependency.
 * If the API or GitHub is unreachable, those sources are skipped silently.
 */

const fs = require("fs");
const path = require("path");

const SITE = "https://www.abhicabs24x7.com";
const API_BASE = (process.env.VITE_API_BASE_URL || "https://api.abhicabs24x7.com/api/v1").replace(/\/api\/v1\/?$/, "");
const GH_TOKEN = process.env.VITE_GH_TOKEN;
const GH_REPO = process.env.VITE_GH_REPO || "skyupdigitalsolutions-cpu/abhicabs-customer-website";

// ── 1. Static routes ────────────────────────────────────────────────────────
const STATIC_URLS = [
  { path: "/",                            priority: "1.0", changefreq: "weekly" },
  { path: "/services",                    priority: "0.9", changefreq: "weekly" },
  { path: "/services/one-way-outstation", priority: "0.9", changefreq: "weekly" },
  { path: "/services/round-trip",         priority: "0.9", changefreq: "weekly" },
  { path: "/services/local",              priority: "0.9", changefreq: "weekly" },
  { path: "/services/airport-taxi",   priority: "0.9", changefreq: "weekly" },
  { path: "/services/corporate",          priority: "0.8", changefreq: "monthly" },
  { path: "/bangalore/car-rental",        priority: "0.9", changefreq: "weekly" },
  { path: "/vehicles/tempo-traveller",    priority: "0.9", changefreq: "weekly" },
  { path: "/outstation",                  priority: "0.9", changefreq: "monthly" },
  { path: "/fleet",                       priority: "0.8", changefreq: "monthly" },
  { path: "/about",                       priority: "0.6", changefreq: "monthly" },
  { path: "/contact-us",                  priority: "0.7", changefreq: "monthly" },
  { path: "/blogs",                       priority: "0.7", changefreq: "daily" },
  { path: "/cancellation",               priority: "0.3", changefreq: "yearly" },
  { path: "/privacy",                     priority: "0.3", changefreq: "yearly" },
  { path: "/terms",                       priority: "0.3", changefreq: "yearly" },
];

const BUILT_IN_SERVICE_SLUGS = ["local", "airport-taxi", "one-way-outstation", "round-trip", "corporate"];

// ── 2. Fetch CMS service pages ──────────────────────────────────────────────
async function fetchCmsPages() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/blog/pages`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const pages = json?.data || {};
    const urls = [];
    for (const [id, page] of Object.entries(pages)) {
      if (!page || (!page._service && !page._template)) continue;
      const slug = page._slug || id;
      if (BUILT_IN_SERVICE_SLUGS.includes(slug)) continue;
      urls.push({ path: `/services/${slug}`, priority: "0.7", changefreq: "monthly" });
    }
    return urls;
  } catch {
    console.log("  ⚠ Could not reach backend API — CMS pages skipped.");
    return [];
  }
}

// ── 3. Fetch blogs from GitHub ──────────────────────────────────────────────
async function fetchGitHubFile(filePath) {
  if (!GH_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${filePath}?ref=main`,
      { headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const file = await res.json();
    return Buffer.from(file.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function parseBlogsArray(src) {
  if (!src) return [];
  try {
    const body = src.replace(/^[\s\S]*?export\s+const\s+\w+\s*=\s*/, "").replace(/;?\s*$/, "").trim();
    return new Function(`return ${body || "[]"}`)();
  } catch {
    return [];
  }
}

function isPublished(b) {
  return b && b.slug && !b.draft && (!b.status || String(b.status).toLowerCase() === "published");
}

function blogDate(b) {
  if (!b.date) return null;
  try { const d = new Date(b.date); return isNaN(d) ? null : d.toISOString().slice(0, 10); } catch { return null; }
}

async function fetchBlogUrls() {
  const [blogsSource, seoSource] = await Promise.all([
    fetchGitHubFile("src/data/blogs.js"),
    fetchGitHubFile("src/data/seoArticles.js"),
  ]);
  const cms = parseBlogsArray(blogsSource).filter(isPublished);
  const seo = parseBlogsArray(seoSource).filter(isPublished);
  const taken = new Set(cms.map((b) => b.slug));
  const merged = [...cms, ...seo.filter((a) => !taken.has(a.slug))];
  return merged.map((b) => ({
    path: `/blogs/${b.slug}`,
    priority: "0.6",
    changefreq: "monthly",
    lastmod: blogDate(b),
  }));
}

// ── XML builder ─────────────────────────────────────────────────────────────
function escapeXml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function buildXml(urls) {
  const entries = urls.map((u) => {
    const parts = [`    <loc>${escapeXml(SITE + u.path)}</loc>`];
    if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
    if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
    return `  <url>\n${parts.join("\n")}\n  </url>`;
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <!-- Generated ${new Date().toISOString()} by scripts/generate-sitemap.js -->`,
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Generating sitemap…");

  const [cmsUrls, blogUrls] = await Promise.all([
    fetchCmsPages(),
    GH_TOKEN ? fetchBlogUrls() : Promise.resolve([]),
  ]);

  if (!GH_TOKEN) console.log("  ⚠ VITE_GH_TOKEN not set — blog URLs from bundled source only.");

  const staticPaths = new Set(STATIC_URLS.map((u) => u.path));
  const allUrls = [
    ...STATIC_URLS,
    ...cmsUrls.filter((u) => !staticPaths.has(u.path)),
    ...blogUrls.filter((u) => !staticPaths.has(u.path)),
  ];

  const xml = buildXml(allUrls);
  const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");

  console.log(`  ✓ ${allUrls.length} URLs written to public/sitemap.xml`);
  console.log(`    Static: ${STATIC_URLS.length} | CMS pages: ${cmsUrls.length} | Blogs: ${blogUrls.length}`);
}

main().catch((err) => { console.error("Sitemap generation failed:", err); process.exit(1); });
