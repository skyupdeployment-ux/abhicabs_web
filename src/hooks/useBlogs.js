import { useMemo, useState, useEffect } from "react";
import { BLOGS } from "../data/blogs";
import { SAMPLE_BLOGS } from "../data/sampleBlogs";
import { SEO_ARTICLES } from "../data/seoArticles";
import { sortBlogs } from "../lib/blog";

/**
 * The single source of blog posts for every blog page.
 *
 * **LIVE CONTENT**: On the client, this hook fetches the latest blogs.js from
 * GitHub so newly published posts appear instantly — no rebuild needed.
 * The bundled BLOGS array is the SSR/initial-render fallback.
 *
 * Priority: GitHub live > bundled BLOGS > SEO_ARTICLES > sample posts (dev only).
 */
const SAMPLE_ALLOWED = import.meta.env.DEV || String(import.meta.env.VITE_BLOG_SAMPLE_DATA).toLowerCase() === "true";
const isPublished = (b) => b && b.slug && !b.draft && (!b.status || String(b.status).toLowerCase() === "published");

const GH_TOKEN = import.meta.env.VITE_GH_TOKEN;
const GH_REPO = import.meta.env.VITE_GH_REPO || "skyupdigitalsolutions-cpu/abhicabs-customer-website";
const GH_FILE = "src/data/blogs.js";

// In-memory cache so we don't refetch on every component mount
let _liveCache = null;
let _liveFetched = false;
let _liveFetching = false;
let _liveListeners = [];

function notifyListeners(data) {
  _liveListeners.forEach((fn) => fn(data));
}

async function fetchLiveBlogs() {
  if (_liveFetched || _liveFetching || !GH_TOKEN) return _liveCache;
  _liveFetching = true;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}?ref=main&t=${Date.now()}`,
      { headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json" }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const file = await res.json();
    const text = new TextDecoder("utf-8").decode(
      Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0))
    );
    const body = text.replace(/^[\s\S]*?export\s+const\s+BLOGS\s*=\s*/, "").replace(/;?\s*$/, "").trim();
    // eslint-disable-next-line no-new-func
    const arr = new Function(`return ${body || "[]"}`)();
    if (!Array.isArray(arr)) return null;
    _liveCache = arr;
    _liveFetched = true;
    notifyListeners(arr);
    return arr;
  } catch {
    return null;
  } finally {
    _liveFetching = false;
  }
}

/** Merge blogs from multiple sources, dedup by slug, filter published, sort. */
function mergeBlogs(liveBlogs) {
  // Priority: live GitHub > bundled BLOGS > SEO_ARTICLES
  const primary = (liveBlogs || BLOGS || []).filter(isPublished);
  const taken = new Set(primary.map((b) => b.slug));
  const seo = (SEO_ARTICLES || []).filter((a) => isPublished(a) && !taken.has(a.slug));
  const merged = [...primary, ...seo];
  if (merged.length) return { blogs: sortBlogs(merged), isSample: false };
  return SAMPLE_ALLOWED ? { blogs: sortBlogs(SAMPLE_BLOGS), isSample: true } : { blogs: [], isSample: false };
}

/** SSR-safe: returns bundled blogs immediately. */
export function getBlogs() {
  return mergeBlogs(_liveCache);
}

/**
 * Hook: returns { blogs, isSample }.
 * On client, triggers a background fetch from GitHub and re-renders with live data.
 */
export default function useBlogs() {
  const initial = useMemo(() => mergeBlogs(_liveCache), []);
  const [data, setData] = useState(initial);

  useEffect(() => {
    // If we already have live data cached, use it
    if (_liveFetched && _liveCache) {
      const merged = mergeBlogs(_liveCache);
      setData(merged);
      return;
    }

    // Listen for live data
    const listener = (liveBlogs) => {
      setData(mergeBlogs(liveBlogs));
    };
    _liveListeners.push(listener);

    // Trigger fetch
    fetchLiveBlogs();

    return () => {
      _liveListeners = _liveListeners.filter((fn) => fn !== listener);
    };
  }, []);

  return data;
}

/** Force a refetch (called after publishing a new post). */
export function refreshLiveBlogs() {
  _liveFetched = false;
  _liveFetching = false;
  _liveCache = null;
  fetchLiveBlogs();
}
