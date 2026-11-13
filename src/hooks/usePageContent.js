/**
 * src/hooks/usePageContent.js
 *
 * Fetches page content from the CMS (GET /api/v1/blog/pages — public endpoint).
 * Returns the sections array for the requested page, falling back to defaults
 * if the backend is unreachable or the page hasn't been customized yet.
 *
 * Usage:
 *   const { sections, get, loading } = usePageContent("home");
 *   // sections = array of section objects
 *   // get("hero", "title") = find the first section of type "hero" and return its "title" field
 */

import { useState, useEffect, useContext, createContext } from "react";

/** Pages fetched on the SERVER for this request (see src/lib/serviceData.js); null when a page has no server data. */
export const PagesContext = createContext(null);

import { API_ROOT } from "../lib/apiBase";
const API_BASE = API_ROOT;

// In-memory cache so multiple components on one page don't re-fetch
let _cache = null;
let _promise = null;

function fetchPages() {
  if (_promise) return _promise;
  _promise = fetch(`${API_BASE}/api/v1/blog/pages`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((json) => {
      _cache = json?.data || {};
      return _cache;
    })
    .catch(() => {
      _cache = {};
      return _cache;
    });
  return _promise;
}

/** useAllPages() — every CMS page keyed by id (shares the cache above). {} until loaded / on error. */
export function useAllPages() {
  const server = useContext(PagesContext);
  const [data, setData] = useState(_cache);
  useEffect(() => {
    if (server) return;                       // already have this request's pages from the server
    if (_cache) { setData(_cache); return; }
    fetchPages().then(setData);
  }, [server]);
  return server || data || {};
}

/** Same as useAllPages but also reports `loading` (for pages that must tell "not found" from "not loaded"). */
export function useAllPagesState() {
  const server = useContext(PagesContext);
  const [data, setData] = useState(_cache);
  useEffect(() => {
    if (server) return;
    if (_cache) { setData(_cache); return; }
    fetchPages().then(setData);
  }, [server]);
  return { pages: server || data || {}, loading: !(server || data) };
}

export function usePageContent(pageId) {
  const [data, setData] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) {
      setData(_cache);
      setLoading(false);
      return;
    }
    fetchPages().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const page = data?.[pageId] || {};
  const sections = page.sections || [];

  /**
   * get(type, field, fallback) — find the first section of a given type
   * and return one of its fields.
   *
   * get("hero", "title", "Default Title")
   */
  const get = (type, field, fallback = "") => {
    const section = sections.find((s) => s.type === type);
    if (!section) return fallback;
    return section[field] ?? fallback;
  };

  /**
   * getAll(type) — return all sections of a given type.
   */
  const getAll = (type) => sections.filter((s) => s.type === type);

  /**
   * getItems(type, field, fallback) — get an array field from the first
   * section of the given type.
   *
   * getItems("features", "items", [])
   */
  const getItems = (type, field = "items", fallback = []) => {
    const section = sections.find((s) => s.type === type);
    return section?.[field] || fallback;
  };

  /**
   * getLayout(defaultOrder) — ordered list of { key, hidden } describing which
   * built-in sections render and in what order. Reads page._layout (saved from
   * the builder). Falls back to defaultOrder (all visible). Unknown saved keys
   * are dropped; default keys missing from a saved layout are appended, so a
   * newly-added section never silently disappears.
   */
  const getLayout = (defaultOrder = []) => {
    const saved = Array.isArray(page._layout) ? page._layout : null;
    if (!saved || !saved.length) return defaultOrder.map((key) => ({ key, hidden: false }));
    const known = new Set(defaultOrder);
    const out = saved
      .filter((e) => e && known.has(e.key))
      .map((e) => ({ key: e.key, hidden: !!e.hidden }));
    const seen = new Set(out.map((e) => e.key));
    for (const key of defaultOrder) if (!seen.has(key)) out.push({ key, hidden: false });
    return out;
  };

  return { sections, get, getAll, getItems, getLayout, loading, raw: page };
}

export default usePageContent;

/**
 * usePageSections(pageId) — returns sections array + loading state
 * for use with SectionRenderer. Renders the full CMS layout.
 */
export function usePageSections(pageId) {
  const { sections, loading, raw } = usePageContent(pageId);
  return { sections, loading, hasCustomContent: sections.length > 0, raw };
}
