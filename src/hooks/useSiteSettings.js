/**
 * src/hooks/useSiteSettings.js
 *
 * Fetches global site settings (header + footer) from the CMS
 * (GET /api/v1/blog/site-settings — public). Falls back to {} when the backend
 * is unreachable or nothing has been customised yet, so every consumer must
 * pass its own hardcoded default to get()/getList() — the live site then keeps
 * working exactly as before until an admin saves overrides.
 */
import { useState, useEffect } from "react";

import { API_ROOT } from "../lib/apiBase";
const API_BASE = API_ROOT;

let _cache = null;
let _promise = null;

function fetchSettings() {
  if (_promise) return _promise;
  _promise = fetch(`${API_BASE}/api/v1/blog/site-settings`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((json) => { _cache = json?.data || {}; return _cache; })
    .catch(() => { _cache = {}; return _cache; });
  return _promise;
}

export function useSiteSettings() {
  const [data, setData] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setData(_cache); setLoading(false); return; }
    fetchSettings().then((d) => { setData(d); setLoading(false); });
  }, []);

  const header = data?.header || {};
  const footer = data?.footer || {};

  // get("header","phone","default") — returns a scalar field or the fallback
  const get = (group, field, fallback = "") => {
    const g = group === "header" ? header : footer;
    const v = g?.[field];
    return v === undefined || v === null || v === "" ? fallback : v;
  };

  // getList("header","nav",[...]) — returns a non-empty array or the fallback
  const getList = (group, field, fallback = []) => {
    const g = group === "header" ? header : footer;
    const v = g?.[field];
    return Array.isArray(v) && v.length ? v : fallback;
  };

  return { header, footer, get, getList, loading };
}

export default useSiteSettings;
