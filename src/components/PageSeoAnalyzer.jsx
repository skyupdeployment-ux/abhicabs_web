/**
 * PageSeoAnalyzer.jsx — SEO analysis for CMS main pages.
 *
 * Analyzes the sections of a page for SEO best practices:
 * title, descriptions, headings, images, links, content depth, etc.
 */

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, AlertTriangle,
  Info, Target, Type, FileText, ImageIcon, Link2, BarChart3, Hash,
} from "lucide-react";

function analyzePage(pageName, sections, codeBacked) {
  const issues = [];
  const add = (sev, title, detail, tip) => {
    issues.push({ id: `p-${issues.length}`, severity: sev, title, detail, tip });
  };

  if (!sections || sections.length === 0) {
    add("critical", "Empty page", "This page has no sections.", "Add at least a hero section and some content.");
    return { issues, passes: [], score: 5 };
  }

  const visible = sections.filter(s => !s._hidden);
  const heroes = visible.filter(s => s.type === "hero");
  const texts = visible.filter(s => s.type === "text");
  const images = visible.filter(s => s.type === "image" || s.type === "gallery");
  const faqs = visible.filter(s => s.type === "faq");
  const ctas = visible.filter(s => s.type === "cta");
  const features = visible.filter(s => s.type === "features");
  const allText = visible.map(s => {
    const parts = [];
    if (s.title) parts.push(s.title);
    if (s.accent) parts.push(s.accent);
    if (s.description) parts.push(s.description);
    if (s.heading) parts.push(s.heading);
    if (s.body) parts.push(s.body);
    if (s.text) parts.push(s.text);
    (s.items || []).forEach(i => {
      if (i.title) parts.push(i.title);
      if (i.description) parts.push(i.description);
      if (i.question) parts.push(i.question);
      if (i.answer) parts.push(i.answer);
      if (i.quote) parts.push(i.quote);
      if (i.bio) parts.push(i.bio);
      if (i.content) parts.push(i.content);
    });
    return parts.join(" ");
  }).join(" ");
  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;

  // ── Hero checks
  if (heroes.length === 0) {
    add("error", "No hero section", "Pages should have a hero/banner section at the top.", "Add a Hero Banner section with a clear title and description.");
  } else {
    const h = heroes[0];
    if (heroes.length > 1) add("warning", "Multiple hero sections", `${heroes.length} heroes — their titles all render as H1.`, "Keep a single hero (one H1); make the others regular sections.");
    if (!h.title) add("warning", "Hero has no title (H1)", "The hero is missing the page's main heading.", "Add a descriptive H1 title to the hero.");
    else {
      add("pass", "Hero title present (H1)", `"${h.title}"`, "");
      if (h.title.length > 60) add("suggestion", "Hero title may be truncated", `${h.title.length} characters.`, "Used as the page title, keep it 50–60 characters, keyword first.");
      else if (h.title.length < 30) add("suggestion", "Hero title is short", `${h.title.length} characters.`, "A fuller title (50–60 chars) describes the service better for search.");
    }
    if (!h.description) add("warning", "Hero has no description", "A description helps search engines understand the page.", "Add 1-2 sentences describing this service.");
    else {
      add("pass", "Hero description present", "", "");
      if (h.description.length > 160) add("suggestion", "Hero description long for a snippet", `${h.description.length} characters.`, "If it doubles as the meta description, keep it to 150–160 characters.");
    }
    if (!h.ctaText) add("suggestion", "No CTA button in hero", "A call-to-action button improves conversions.", "Add a CTA like 'Get Instant Quote'.");
    if (!h.image) add("suggestion", "No hero background image", "A background image makes the hero more engaging.", "Upload a relevant background image (WebP, with width & height set).");
  }

  if (codeBacked) {
    // Main pages (Home, About, etc.) render most of their content from built-in
    // site code — booking widget, fleet, routes, banners, footer — which this
    // analyzer can't see. Counting only the CMS-managed blocks here would cry
    // "thin content / few sections" on a page that is actually full, so those
    // two checks are replaced with a note.
    add("info", "Only CMS-managed sections are measured", `This page also has built-in sections in the site code (booking widget, fleet, routes, banners…) that aren't editable here and aren't counted. The word/section counts below cover only the ${visible.length} CMS block${visible.length !== 1 ? "s" : ""}.`, "");
  } else {
    // ── Content depth
    if (wordCount < 100) add("warning", "Very little content", `Only ~${wordCount} words across all sections.`, "Add more text content for better SEO. Aim for 300+ words.");
    else if (wordCount < 300) add("suggestion", "Content could be deeper", `~${wordCount} words total.`, "Consider adding more sections to reach 500+ words.");
    else add("pass", "Good content depth", `~${wordCount} words across ${visible.length} sections.`, "");

    // ── Section variety
    if (visible.length < 3) add("suggestion", "Few sections", `Only ${visible.length} section${visible.length > 1 ? "s" : ""}.`, "Add more sections (text, features, FAQ, testimonials) for a richer page.");
    else add("pass", "Good section count", `${visible.length} sections provide good structure.`, "");
  }

  // ── Images
  const allImages = [];
  visible.forEach(s => {
    if (s.image) allImages.push({ src: s.image, alt: s.alt || s.title || "" });
    if (s.url && s.type === "image") allImages.push({ src: s.url, alt: s.alt || "" });
    (s.images || []).forEach(img => allImages.push(img));
    (s.items || []).forEach(i => { if (i.image) allImages.push({ src: i.image, alt: i.title || "" }); });
  });

  if (allImages.length === 0 && wordCount > 100) add("suggestion", "No images on page", "Pages with images rank and engage better.", "Add images to at least one section.");
  else if (allImages.length > 0) add("pass", `${allImages.length} image${allImages.length > 1 ? "s" : ""} found`, "", "");

  const noAlt = allImages.filter(img => !img.alt);
  if (noAlt.length > 0) add("warning", `${noAlt.length} image${noAlt.length > 1 ? "s" : ""} missing alt text`, "Alt text is important for accessibility and SEO.", "Add descriptive alt text to every image — no keyword stuffing.");
  const genericImgs = allImages.filter(img => /(^|\/)(img[_-]?\d+|dsc[_-]?\d+|screenshot|untitled|image\d*|photo\d*)\.[a-z0-9]+(\?|#|$)/i.test(img.src || ""));
  if (genericImgs.length > 0) add("suggestion", `${genericImgs.length} generic image filename${genericImgs.length > 1 ? "s" : ""}`, "Files like IMG_4920.jpg carry no SEO value.", "Rename images descriptively (with a keyword where relevant) before uploading.");

  // ── FAQ (structured data opportunity)
  if (faqs.length > 0) {
    const totalQs = faqs.reduce((sum, f) => sum + (f.items?.length || 0), 0);
    if (totalQs > 0) add("pass", `FAQ with ${totalQs} question${totalQs > 1 ? "s" : ""}`, "FAQ sections can generate rich results in Google.", "");
    const emptyQs = faqs.flatMap(f => f.items || []).filter(q => !q.question || !q.answer);
    if (emptyQs.length > 0) add("warning", `${emptyQs.length} FAQ item${emptyQs.length > 1 ? "s" : ""} incomplete`, "Questions or answers are empty.", "Fill in all FAQ questions and answers.");
  }

  // ── CTA
  if (ctas.length === 0 && heroes.every(h => !h.ctaText)) {
    add("suggestion", "No call-to-action", "Pages without a CTA miss conversion opportunities.", "Add a CTA section with a clear action button.");
  } else {
    add("pass", "CTA present", "Page has a call-to-action.", "");
  }

  // ── Internal links in text sections
  const hasLinks = texts.some(t => t.body && (t.body.includes("href") || t.body.includes("<a")));
  if (!hasLinks && wordCount > 200) add("suggestion", "No internal links in text", "Internal links help SEO and navigation.", "Add links to related pages in your text sections.");
  const vagueAnchor = texts.some(t => />\s*(click here|read more|here|learn more|more)\s*</i.test(t.body || ""));
  if (vagueAnchor) add("suggestion", "Non-descriptive link text", `Anchors like "click here" give no context.`, "Use descriptive anchor text that says where the link goes.");

  // ── Structured data (framework) — service pages benefit from schema
  if (!codeBacked) {
    if (faqs.some(f => (f.items || []).some(q => q.question && q.answer))) {
      add("suggestion", "Add FAQPage structured data", "Your FAQ can earn rich results in Google.", "Output FAQPage JSON-LD for these questions.");
    }
    add("suggestion", "Add Service & Breadcrumb schema", "Service pages rank better with structured data.", "Add Service (name, provider, areaServed) and BreadcrumbList JSON-LD.");
  }

  // ── Features section
  if (features.length > 0) {
    features.forEach(f => {
      const emptyItems = (f.items || []).filter(i => !i.title);
      if (emptyItems.length > 0) add("warning", `${emptyItems.length} feature${emptyItems.length > 1 ? "s" : ""} without title`, "Feature cards need titles.", "Add a title to every feature card.");
    });
  }

  // ── Hidden sections warning
  const hiddenCount = sections.filter(s => s._hidden).length;
  if (hiddenCount > 0) add("info", `${hiddenCount} hidden section${hiddenCount > 1 ? "s" : ""}`, "Hidden sections don't appear on the live page.", "Review hidden sections — unhide or delete if not needed.");

  // ── Score
  const passes = issues.filter(i => i.severity === "pass");
  const criticals = issues.filter(i => i.severity === "critical").length;
  const errors = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  const suggestions = issues.filter(i => i.severity === "suggestion").length;
  const penalty = criticals * 40 + errors * 25 + warnings * 12 + suggestions * 5;
  const bonus = passes.length * 12;
  const score = Math.max(0, Math.min(100, 100 - penalty + bonus));

  return {
    issues: issues.filter(i => i.severity !== "pass"),
    passes,
    score: Math.round(score),
    wordCount,
    sectionCount: visible.length,
    imageCount: allImages.length,
  };
}

// ── UI ──────────────────────────────────────────────────────────────

const SEV = {
  critical:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Critical" },
  error:      { color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", label: "Error" },
  warning:    { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Warning" },
  suggestion: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Tip" },
  info:       { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", label: "Info" },
};

export default function PageSeoAnalyzer({ pageName, sections, codeBacked = false }) {
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(true);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; clearTimeout(debounceRef.current); }; }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setResult(analyzePage(pageName, sections, codeBacked));
    }, 600);
  }, [pageName, sections, codeBacked]);

  if (!result) return null;
  const { issues, passes, score, wordCount, sectionCount, imageCount } = result;
  const clr = score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626";

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      {/* Header */}
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", border: "none", background: "#FAFAFA", cursor: "pointer", borderBottom: open ? "1px solid #E5E7EB" : "none" }}>
        <Target size={16} style={{ color: "#F5A623" }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 800, color: "#111" }}>Page SEO Check</span>
        {/* Score pill */}
        <span style={{ fontSize: 13, fontWeight: 900, color: clr, background: `${clr}12`, padding: "3px 12px", borderRadius: 20 }}>{score}/100</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{ padding: "14px 18px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
            <span>~{wordCount} words</span>
            <span>{sectionCount} sections</span>
            <span>{imageCount} images</span>
            <span>{issues.length} issue{issues.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Issues */}
          {issues.map(issue => {
            const s = SEV[issue.severity] || SEV.info;
            return (
              <details key={issue.id} style={{ borderRadius: 10, border: `1px solid ${s.border}`, background: s.bg, marginBottom: 5, overflow: "hidden" }}>
                <summary style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#111" }}>
                  <AlertCircle size={13} style={{ color: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{issue.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.color, textTransform: "uppercase" }}>{s.label}</span>
                </summary>
                <div style={{ padding: "0 12px 8px", fontSize: 11.5, color: "#374151", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 4px" }}>{issue.detail}</p>
                  {issue.tip && <p style={{ margin: 0, padding: "4px 8px", background: "rgba(255,255,255,0.6)", borderRadius: 7, fontSize: 11, color: "#059669", fontWeight: 600 }}>💡 {issue.tip}</p>}
                </div>
              </details>
            );
          })}

          {/* Passes */}
          {passes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>✓ Passed ({passes.length})</div>
              {passes.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", fontSize: 11, color: "#059669", background: "#ECFDF5", borderRadius: 7, marginBottom: 2 }}>
                  <CheckCircle size={11} /> {p.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
