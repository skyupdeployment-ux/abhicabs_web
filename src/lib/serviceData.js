/**
 * Server-side data for /services/<slug> (Vike `+data` hook — runs on the server for the first request and in the
 * browser for client-side navigation).
 *
 * Why: pages created in the CMS (state / city / route pages) used to render as "Loading page…" and only filled in after
 * JavaScript ran, so crawlers got an empty shell and an unknown slug answered 200. Fetching here gives crawlers the real
 * HTML and lets an unknown slug return a genuine 404.
 *
 * Failure-safe: if the API can't be reached we do NOT 404 (a valid page must never disappear during an outage); we hand
 * back `loadFailed` and the component falls back to its client-side fetch (and marks that fallback noindex).
 */
import { render } from "vike/abort";
import { SERVICE_DEFAULTS } from "../content/serviceDefaults";

import { API_ROOT } from "./apiBase";
const API_BASE = API_ROOT;

export async function fetchAllPages(timeoutMs = 4000) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl && setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/v1/blog/pages`, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res.ok) return { ok: false, pages: {} };
    const json = await res.json();
    return { ok: true, pages: json?.data && typeof json.data === "object" ? json.data : {} };
  } catch {
    return { ok: false, pages: {} };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const findPage = (pages, slug) => Object.entries(pages).find(([id, p]) => id === slug || p?._slug === slug)?.[1] || null;

/** `+data` factory. Pass a slug for the fixed built-in routes; omit it for the dynamic /services/:slug route. */
export function makeServiceData(fixedSlug) {
  return async function data(pageContext) {
    const slug = fixedSlug || pageContext.routeParams?.slug;
    const { ok, pages } = await fetchAllPages();
    const page = findPage(pages, slug);
    if (ok && !page && !SERVICE_DEFAULTS[slug]) throw render(404, "Page not found"); // real 404, not a soft one
    return { slug, page, allPages: ok ? pages : null, loadFailed: !ok };
  };
}
