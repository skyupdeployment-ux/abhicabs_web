import { useCallback, useEffect, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";

/**
 * Blog listing state (category · search · page) kept in the URL — shareable, refresh-safe,
 * and read on the server so SSR matches the first client render.
 *   /blogs?category=travel-tips&q=airport&page=2
 * Changes use history.replaceState/pushState (no reload). Search is debounced.
 */
export default function useBlogQuery() {
  const search = usePageContext().urlParsed?.search || {};
  const [category, setCategoryState] = useState(String(search.category || ""));
  const [q, setQState] = useState(String(search.q || ""));
  const [qLive, setQLive] = useState(String(search.q || "")); // input value (undebounced)
  const [page, setPageState] = useState(Math.max(1, parseInt(search.page, 10) || 1));
  const timer = useRef(null);

  const sync = useCallback((next, push) => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (next.category) sp.set("category", next.category);
    if (next.q) sp.set("q", next.q);
    if (next.page > 1) sp.set("page", String(next.page));
    const url = window.location.pathname + (sp.toString() ? `?${sp}` : "");
    window.history[push ? "pushState" : "replaceState"](null, "", url);
  }, []);

  const setCategory = (c) => { setCategoryState(c); setPageState(1); sync({ category: c, q, page: 1 }, true); };
  const setPage = (p) => { setPageState(p); sync({ category, q, page: p }, true); };
  const setQuery = (v) => {
    setQLive(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setQState(v.trim()); setPageState(1); sync({ category, q: v.trim(), page: 1 }, false); }, 250);
  };
  const clearAll = () => { clearTimeout(timer.current); setCategoryState(""); setQState(""); setQLive(""); setPageState(1); sync({ category: "", q: "", page: 1 }, true); };
  const clearSearch = () => { clearTimeout(timer.current); setQState(""); setQLive(""); setPageState(1); sync({ category, q: "", page: 1 }, false); };

  // Browser back/forward
  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setCategoryState(sp.get("category") || ""); setQState(sp.get("q") || ""); setQLive(sp.get("q") || ""); setPageState(Math.max(1, parseInt(sp.get("page"), 10) || 1));
    };
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("popstate", onPop); clearTimeout(timer.current); };
  }, []);

  return { category, q, qLive, page, setCategory, setPage, setQuery, clearAll, clearSearch };
}
