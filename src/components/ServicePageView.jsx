import React from "react";
import { useConfig } from "vike-react/useConfig";
import { Head } from "vike-react/Head";
import { usePageContext } from "vike-react/usePageContext";
import EmojiIcon from "./ui/EmojiIcon";
import SectionRenderer from "./SectionRenderer";
import ServiceLanding from "./ServiceLanding";
import { useAllPagesState } from "../hooks/usePageContent";
import { SERVICE_DEFAULTS } from "../content/serviceDefaults";
import { isTemplatePage, toServiceCfg } from "../lib/servicePage";

/**
 * ONE renderer for every /services/<slug> page. The layout is the fixed ServiceLanding
 * template; only the content varies, in this priority:
 *   1. a CMS service page with this slug          (dynamic — created/edited in the CMS)
 *   2. the built-in default for the five services  (src/content/serviceDefaults.js)
 *   3. an older section-based CMS page             (legacy, still supported)
 *   4. "Page not found"
 * Built-ins render instantly (including on the server) and swap to the CMS version if one exists.
 */
export default function ServicePageView({ slug }) {
  const config = useConfig();
  const { data } = usePageContext();          // from +data: { page, allPages, loadFailed } — fetched on the server
  const { pages, loading } = useAllPagesState();
  const found = data?.page || Object.entries(pages).find(([id, p]) => id === slug || p?._slug === slug)?.[1];
  const builtIn = SERVICE_DEFAULTS[slug];

  if (found && isTemplatePage(found)) {
    const c = found._content;
    config({ title: c.seo?.title || `${found._label || slug} | Abhi Cabs`, description: c.seo?.description });
    return <ServiceLanding key={slug} cfg={toServiceCfg(slug, c)} />;
  }
  if (builtIn) return <ServiceLanding key={slug} cfg={builtIn} />;
  if (found?.sections?.length) return <SectionRenderer sections={found.sections} />;

  // Only reached when the server could not load the page list (API outage) or a legacy client-only route: keep it out of the index.
  const noindex = <Head><meta name="robots" content="noindex, follow" /></Head>;
  if (loading) return (<>{noindex}
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTopColor: "#FFD54F", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>Loading page…
      </div>
    </div></>
  );
  return (<>{noindex}
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ marginBottom: 16 }}><EmojiIcon glyph="📄" size={48} color="#9CA3AF" /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Page not found</h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 20 }}>The page "{slug}" doesn't exist or hasn't been published yet.</p>
        <a href="/services" style={{ display: "inline-block", padding: "12px 28px", background: "#FFD54F", color: "#111", borderRadius: 9999, fontWeight: 700, textDecoration: "none" }}>View Services</a>
      </div>
    </div></>
  );
}
