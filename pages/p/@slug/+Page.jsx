import EmojiIcon from "../../../src/components/ui/EmojiIcon";
/**
 * Dynamic CMS page — renders any page created in the CMS at /p/:slug
 *
 * Fetches page content from GET /api/v1/blog/pages, finds the matching
 * slug, and renders its sections using SectionRenderer.
 */

import { useState, useEffect } from "react";
import { usePageContext } from "vike-react/usePageContext";
import SectionRenderer from "../../../src/components/SectionRenderer";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.abhicabs24x7.com"
).replace(/\/api\/v1\/?$/, "");

export default function Page() {
  const ctx = usePageContext();
  const slug = ctx.routeParams?.slug || "";
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) { setLoading(false); setError("No page slug"); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/blog/pages`);
        const json = await res.json();
        const allPages = json?.data || {};

        // Find page by slug (the page ID or a custom _slug field)
        const found = Object.entries(allPages).find(([id, p]) =>
          id === slug || p._slug === slug
        );

        if (found) {
          setPage({ id: found[0], ...found[1] });
        } else {
          setError("Page not found");
        }
      } catch (e) {
        setError("Could not load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#9CA3AF" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTopColor: "#F5A623", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        Loading page…
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ marginBottom: 16 }}><EmojiIcon glyph="📄" size={48} color="#9CA3AF" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Page not found</h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 20 }}>The page "{slug}" doesn't exist or hasn't been published yet.</p>
        <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: "#1B1B1B", color: "#fff", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Go Home</a>
      </div>
    </div>
  );

  return <SectionRenderer sections={page.sections || []} />;
}
