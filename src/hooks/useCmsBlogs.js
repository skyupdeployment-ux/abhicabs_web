import { useCallback, useEffect, useState } from "react";
import { BLOGS as BUNDLED } from "../data/blogs";
import { fetchBlogsFile, ghConfigured } from "../lib/githubBlogs";

let cache = null; // shared by every CMS screen in this session
/** Call after publishing so the next list view reloads from GitHub. */
export const resetCmsBlogsCache = () => { cache = null; };

/**
 * Blog posts for the CMS. Loads the LIVE list from GitHub; falls back to the bundled
 * list (and says why) when GitHub isn't configured or fails.
 * → { blogs, source: "github" | "bundled", status: "loading" | "ready" | "error", error, refresh }
 */
export default function useCmsBlogs() {
  const [state, setState] = useState(cache || { blogs: BUNDLED, source: "bundled", status: ghConfigured() ? "loading" : "ready", error: ghConfigured() ? "" : "VITE_GH_TOKEN isn't set — showing only the blogs bundled in this build. Add VITE_GH_TOKEN (GitHub token with repo access) to load, edit and publish the live list." });

  const load = useCallback(async () => {
    if (!ghConfigured()) return;
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const { blogsArray } = await fetchBlogsFile();
      cache = { blogs: blogsArray, source: "github", status: "ready", error: "" };
      setState(cache);
    } catch (e) {
      setState({ blogs: BUNDLED, source: "bundled", status: "error", error: e.message || "Could not load blogs from GitHub." });
    }
  }, []);

  useEffect(() => { if (!cache) load(); }, [load]);
  return { ...state, refresh: () => { cache = null; load(); } };
}
