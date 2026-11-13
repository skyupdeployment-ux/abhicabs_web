/**
 * SeoAnalyzer.jsx — Live SEO analysis panel for the CMS blog editor.
 *
 * SECURITY:
 * - DOMParser is used read-only for counting headings/images/links.
 *   No parsed content is rendered back to the DOM (no XSS vector).
 * - Keyword regex is escaped to prevent ReDoS from special characters.
 * - All inputs are sanitized with trim() and null coalescing.
 * - SERP preview uses textContent-only rendering (no dangerouslySetInnerHTML).
 *
 * PERFORMANCE:
 * - 600ms debounce prevents excessive analysis during typing.
 * - Cleanup on unmount prevents stale setState calls.
 * - DOMParser result is not retained (GC-friendly).
 *
 * Usage:
 *   <SeoAnalyzer
 *     title="Blog post title"
 *     metaTitle="SEO title"
 *     metaDescription="Meta description"
 *     slug="blog-slug"
 *     keywords="primary keyword, secondary"
 *     bodyHtml="<p>HTML content</p>"
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, AlertTriangle,
  Info, Search, Type, FileText, Image as ImageIcon, Link2, Hash,
  BarChart3, Target,
} from "lucide-react";
import { SITE_ORIGIN } from "../lib/seo/constants.js";

// Host shown in the SERP preview (e.g. "www.abhicabs24x7.com").
const SERP_HOST = SITE_ORIGIN.replace(/^https?:\/\//, "");

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════

/** Escape string for safe use in RegExp constructor */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract plain text from HTML safely (no script execution) */
function htmlToText(html) {
  if (!html || typeof window === "undefined") return "";
  try {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    return doc.body?.textContent?.trim() || "";
  } catch { return ""; }
}

/** Parse HTML and extract structured elements (read-only, no rendering) */
function parseHtmlElements(html) {
  const result = { headings: [], images: [], links: [], paragraphs: [], firstParagraph: "" };
  if (!html || typeof window === "undefined") return result;
  try {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h => {
      result.headings.push({ tag: h.tagName, text: (h.textContent || "").trim() });
    });
    // Real paragraph boundaries come from block elements, not from "\n\n" in
    // textContent (DOMParser collapses those away — the old split never matched,
    // so the whole body counted as one giant paragraph and the long-paragraph
    // check fired on every post over ~150 words).
    doc.querySelectorAll("p,li,blockquote").forEach(p => {
      const t = (p.textContent || "").replace(/\s+/g, " ").trim();
      if (t) result.paragraphs.push(t);
    });
    result.firstParagraph = result.paragraphs[0] || "";
    doc.querySelectorAll("img").forEach(img => {
      result.images.push({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
        width: img.getAttribute("width") || "",
        height: img.getAttribute("height") || "",
      });
    });
    doc.querySelectorAll("a[href]").forEach(a => {
      result.links.push({
        href: a.getAttribute("href") || "",
        text: (a.textContent || "").trim(),
      });
    });
  } catch { /* swallow parse errors */ }
  return result;
}

// ══════════════════════════════════════════════════════════════════════
// ANALYSIS ENGINE — deterministic, client-side, no side effects
// ══════════════════════════════════════════════════════════════════════

function analyze({ title, metaTitle, metaDescription, slug, keywords, bodyHtml }) {
  const issues = [];
  const seoTitle = (metaTitle || title || "").trim();
  const desc = (metaDescription || "").trim();
  const kws = (keywords || "").split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
  const primaryKw = kws[0] || "";
  const slugVal = (slug || "").trim();

  // Extract text and elements from HTML (safe, read-only)
  const text = htmlToText(bodyHtml);
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const { headings, images, links, paragraphs, firstParagraph } = parseHtmlElements(bodyHtml);

  const add = (category, severity, title, detail, tip) => {
    issues.push({ id: `${category}-${issues.length}`, category, severity, title, detail, tip });
  };

  // ── TITLE ─────────────────────────────────────────────────────
  if (!seoTitle) {
    add("title", "critical", "Missing SEO title", "No title is set for this post.", "Add a descriptive title that includes your target keyword.");
  } else {
    if (seoTitle.length < 30) add("title", "warning", "Title too short", `Title is ${seoTitle.length} characters.`, "Framework target is 50–60 characters, front-loading the primary keyword.");
    else if (seoTitle.length < 50) add("title", "suggestion", "Title shorter than ideal", `Title is ${seoTitle.length} characters.`, "The framework target is 50–60 characters — add a secondary term or qualifier.");
    else if (seoTitle.length > 60) add("title", "warning", "Title may be truncated", `Title is ${seoTitle.length} characters; Google shows ~60 (≈600px).`, "Trim to 50–60 characters.");
    else add("title", "pass", "Ideal title length", `${seoTitle.length} characters — within the 50–60 target.`, "");

    if (primaryKw) {
      if (!seoTitle.toLowerCase().includes(primaryKw)) {
        add("title", "suggestion", "Keyword not in title", `Your focus keyword "${primaryKw}" doesn't appear in the title.`, "Include the primary keyword naturally in the title, preferably near the beginning.");
      } else if (seoTitle.toLowerCase().indexOf(primaryKw) > 30) {
        add("title", "suggestion", "Keyword appears late in title", "The keyword is in the second half of the title and may be cut off.", "Move the primary keyword closer to the beginning.");
      } else {
        add("title", "pass", "Keyword in title", `"${primaryKw}" appears in the title.`, "");
      }
    }
    if (!/abhi\s*cabs/i.test(seoTitle)) add("title", "suggestion", "Brand not in title", "The title doesn't include your brand name.", "End the title with your brand — e.g. “… | AbhiCabs”.");
  }

  // ── META DESCRIPTION ──────────────────────────────────────────
  if (!desc) {
    add("meta", "error", "Missing meta description", "No meta description is set.", "Write a compelling 120-155 character description that includes your keyword.");
  } else {
    if (desc.length < 70) add("meta", "warning", "Meta description too short", `Description is ${desc.length} characters.`, "Framework target is 150–160 characters to fill the snippet.");
    else if (desc.length < 150) add("meta", "suggestion", "Description shorter than ideal", `Description is ${desc.length} characters.`, "Expand toward 150–160 characters to use the full snippet width.");
    else if (desc.length > 160) add("meta", "warning", "Meta description too long", `Description is ${desc.length} characters; Google truncates ~160 (≈960px).`, "Trim to 150–160 characters.");
    else add("meta", "pass", "Ideal description length", `${desc.length} characters — within the 150–160 target.`, "");

    if (primaryKw) {
      if (!desc.toLowerCase().includes(primaryKw)) add("meta", "suggestion", "Keyword not in description", `"${primaryKw}" doesn't appear in the meta description.`, "Include the keyword naturally — it gets bolded in search results.");
      else add("meta", "pass", "Keyword in description", `"${primaryKw}" appears in the meta description.`, "");
    }
  }

  // ── SLUG ──────────────────────────────────────────────────────
  if (!slugVal) {
    add("slug", "error", "Missing URL slug", "No slug is set.", "Set a short, descriptive slug with your keyword.");
  } else {
    if (slugVal.length > 75) add("slug", "warning", "Slug too long", `Slug is ${slugVal.length} characters.`, "Keep slugs short (3-5 words).");
    else add("slug", "pass", "Good slug length", `${slugVal.length} characters.`, "");

    if (/[A-Z]/.test(slugVal)) add("slug", "suggestion", "Uppercase in slug", "URLs are case-sensitive.", "Use lowercase only.");
    if (/[^a-z0-9-]/.test(slugVal)) add("slug", "warning", "Special characters in slug", "Slugs should contain only lowercase letters, numbers, and hyphens.", "Remove special characters.");
    if (primaryKw && !slugVal.includes(primaryKw.replace(/\s+/g, "-"))) add("slug", "suggestion", "Keyword not in slug", `Slug doesn't contain "${primaryKw}".`, "Include the keyword in the URL.");
  }

  // ── HEADINGS ──────────────────────────────────────────────────
  const h1s = headings.filter(h => h.tag === "H1");
  const h2s = headings.filter(h => h.tag === "H2");
  const emptyHeadings = headings.filter(h => !h.text);

  if (h1s.length > 1) add("heading", "warning", `${h1s.length} H1 headings found`, "Use a single H1 per page.", "Convert extra H1s to H2.");
  if (h2s.length === 0 && wordCount > 300) add("heading", "suggestion", "No subheadings", "Long content without H2s is hard to scan.", "Add H2 headings every 200-300 words.");
  else if (h2s.length > 0) add("heading", "pass", `${h2s.length} subheading${h2s.length > 1 ? "s" : ""} found`, "Content is structured with subheadings.", "");

  if (emptyHeadings.length > 0) add("heading", "warning", `${emptyHeadings.length} empty heading${emptyHeadings.length > 1 ? "s" : ""}`, "Empty headings hurt document structure.", "Remove or fill empty headings.");
  if (primaryKw && h2s.length > 0 && !h2s.some(h => h.text.toLowerCase().includes(primaryKw))) {
    add("heading", "suggestion", "Keyword not in subheadings", `"${primaryKw}" isn't in any H2.`, "Include the keyword in at least one H2.");
  }

  // ── CONTENT ───────────────────────────────────────────────────
  if (wordCount === 0) {
    add("content", "critical", "No content", "The post body is empty.", "Write at least 300 words of useful content.");
  } else if (wordCount < 300) {
    add("content", "warning", "Thin content", `Only ${wordCount} words.`, "Aim for 300+ words. 800-1500 words is ideal for in-depth posts.");
  } else if (wordCount < 600) {
    add("content", "info", "Adequate length", `${wordCount} words — could be more comprehensive.`, "Consider expanding to 800+ words.");
  } else {
    add("content", "pass", "Good content length", `${wordCount} words.`, "");
  }

  // Keyword in first paragraph
  if (primaryKw && text.length > 0) {
    const firstPara = (firstParagraph || text).slice(0, 400);
    if (firstPara.toLowerCase().includes(primaryKw)) {
      add("content", "pass", "Keyword in introduction", `"${primaryKw}" appears in the opening.`, "");
    } else {
      add("content", "suggestion", "Keyword not in introduction", `"${primaryKw}" doesn't appear in the first paragraph.`, "Mention the keyword naturally in the opening.");
    }
  }

  // Keyword density (safe regex — escaped)
  if (primaryKw && wordCount > 50) {
    try {
      const regex = new RegExp(escapeRegex(primaryKw), "gi");
      const count = (text.match(regex) || []).length;
      const density = (count / wordCount) * 100;
      if (count === 0) add("content", "warning", "Keyword missing from body", `"${primaryKw}" doesn't appear in the body text.`, "Use it naturally 2-5 times.");
      else if (density > 3) add("content", "warning", "Keyword overuse", `"${primaryKw}" appears ${count}× (${density.toFixed(1)}% density).`, "Keep density under 2-3%. Write naturally.");
      else add("content", "pass", "Good keyword density", `"${primaryKw}" appears ${count}× (${density.toFixed(1)}%).`, "");
    } catch { /* invalid keyword pattern — skip density check */ }
  }

  // Readability
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 3);
  if (sentences.length >= 3) {
    const avgLen = wordCount / sentences.length;
    if (avgLen > 25) add("content", "suggestion", "Long sentences", `Average ${Math.round(avgLen)} words/sentence.`, "Aim for 15-20 words per sentence.");
    else add("content", "pass", "Good sentence length", `Average ${Math.round(avgLen)} words/sentence.`, "");
  }

  // Long paragraphs (from real block boundaries, not "\n\n" in textContent)
  const longParas = (paragraphs || []).filter(p => p.split(/\s+/).filter(Boolean).length > 150);
  if (longParas.length > 0) add("content", "suggestion", "Long paragraphs", `${longParas.length} paragraph${longParas.length > 1 ? "s" : ""} exceed 150 words.`, "Break into shorter paragraphs (3-5 sentences).");

  // ── IMAGES ────────────────────────────────────────────────────
  if (images.length === 0 && wordCount > 200) {
    add("image", "suggestion", "No images", "Posts with images engage readers better.", "Add at least one relevant image.");
  } else if (images.length > 0) {
    add("image", "pass", `${images.length} image${images.length > 1 ? "s" : ""} found`, "", "");
  }

  const missingAlt = images.filter(img => !img.alt);
  if (missingAlt.length > 0) add("image", "warning", `${missingAlt.length} image${missingAlt.length > 1 ? "s" : ""} missing alt text`, "Alt text helps SEO and accessibility.", "Add descriptive alt text to every image — literal, descriptive terms, no keyword stuffing.");

  // Framework: avoid generic filenames like IMG_4920.jpg
  const genericFiles = images.filter(img => /(^|\/)(img[_-]?\d+|dsc[_-]?\d+|screenshot|untitled|image\d*|photo\d*)\.[a-z0-9]+(\?|#|$)/i.test(img.src));
  if (genericFiles.length > 0) add("image", "suggestion", `${genericFiles.length} generic image filename${genericFiles.length > 1 ? "s" : ""}`, "Files like IMG_4920.jpg carry no SEO signal.", "Rename images descriptively (with a keyword where relevant) before uploading.");

  // Framework: explicit width/height prevents layout shift (CLS — a Core Web Vital)
  const noDims = images.filter(img => !img.width || !img.height);
  if (noDims.length > 0) add("image", "suggestion", `${noDims.length} image${noDims.length > 1 ? "s" : ""} without width/height`, "Missing dimensions cause layout shift (CLS).", "Set explicit width and height attributes so the browser reserves space.");

  if (images.length > 0 && primaryKw) {
    if (images.some(img => img.alt.toLowerCase().includes(primaryKw))) {
      add("image", "pass", "Keyword in image alt", `"${primaryKw}" found in an image alt attribute.`, "");
    } else {
      add("image", "suggestion", "Keyword not in image alt", "No image alt text contains the focus keyword.", "Add the keyword to at least one image alt where relevant.");
    }
  }

  // ── LINKS ─────────────────────────────────────────────────────
  const internalLinks = links.filter(l => l.href.startsWith("/") || l.href.includes("abhicabs"));
  const externalLinks = links.filter(l => l.href.startsWith("http") && !l.href.includes("abhicabs"));
  const emptyAnchors = links.filter(l => !l.text.trim());

  if (internalLinks.length === 0 && wordCount > 300) add("link", "suggestion", "No internal links", "Internal links help SEO and site navigation.", "Link to 2-3 related pages.");
  else if (internalLinks.length > 0) add("link", "pass", `${internalLinks.length} internal link${internalLinks.length > 1 ? "s" : ""}`, "", "");

  if (externalLinks.length === 0 && wordCount > 500) add("link", "info", "No external links", "Linking to sources adds credibility.", "Consider linking to authoritative references.");
  else if (externalLinks.length > 0) add("link", "pass", `${externalLinks.length} external link${externalLinks.length > 1 ? "s" : ""}`, "", "");

  if (emptyAnchors.length > 0) add("link", "warning", `${emptyAnchors.length} link${emptyAnchors.length > 1 ? "s" : ""} with empty text`, "Links need visible text for SEO and accessibility.", "Add descriptive anchor text.");

  // Framework: anchors should be descriptive, not "click here"
  const vagueAnchors = links.filter(l => /^(click here|read more|here|link|this|more|learn more)$/i.test(l.text.trim()));
  if (vagueAnchors.length > 0) add("link", "suggestion", `${vagueAnchors.length} non-descriptive link${vagueAnchors.length > 1 ? "s" : ""}`, `Anchors like "click here" give search engines no context.`, "Use descriptive anchor text that says where the link goes.");

  // ── SCORE ─────────────────────────────────────────────────────
  const weights = { title: 20, meta: 15, slug: 5, heading: 10, content: 30, image: 10, link: 10 };
  const categoryScores = {};

  for (const cat of Object.keys(weights)) {
    const catIssues = issues.filter(i => i.category === cat);
    const passes = catIssues.filter(i => i.severity === "pass").length;
    const criticals = catIssues.filter(i => i.severity === "critical").length;
    const errors = catIssues.filter(i => i.severity === "error").length;
    const warnings = catIssues.filter(i => i.severity === "warning").length;
    const suggestions = catIssues.filter(i => i.severity === "suggestion").length;

    const penalty = criticals * 40 + errors * 25 + warnings * 12 + suggestions * 5;
    const bonus = passes * 15;
    categoryScores[cat] = Math.max(0, Math.min(100, 100 - penalty + bonus));
    if (catIssues.length === 0) categoryScores[cat] = 75;
  }

  let totalScore = 0;
  for (const [cat, w] of Object.entries(weights)) {
    totalScore += (categoryScores[cat] / 100) * w;
  }

  return {
    issues: issues.filter(i => i.severity !== "pass"),
    passes: issues.filter(i => i.severity === "pass"),
    score: Math.round(totalScore),
    categoryScores,
    wordCount,
  };
}

// ══════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════

const SEV = {
  critical:   { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", Icon: AlertCircle,   label: "Critical" },
  error:      { color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", Icon: AlertCircle,   label: "Error" },
  warning:    { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: AlertTriangle, label: "Warning" },
  suggestion: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", Icon: Info,          label: "Tip" },
  info:       { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", Icon: Info,          label: "Info" },
};

const CAT = {
  title:   { Icon: Type,      label: "Title" },
  meta:    { Icon: FileText,  label: "Description" },
  slug:    { Icon: Link2,     label: "URL Slug" },
  heading: { Icon: Hash,      label: "Headings" },
  content: { Icon: BarChart3, label: "Content" },
  image:   { Icon: ImageIcon, label: "Images" },
  link:    { Icon: Link2,     label: "Links" },
};

function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626";
  return (
    <div style={{ width: size, height: size, position: "relative", display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out, stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 900, color }}>
        {score}
      </div>
    </div>
  );
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  const sev = SEV[issue.severity] || SEV.info;
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${sev.border}`, background: sev.bg, marginBottom: 5, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
        <sev.Icon size={13} style={{ color: sev.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.35 }}>{issue.title}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: sev.color, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>{sev.label}</span>
        {open ? <ChevronUp size={12} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={12} style={{ color: "#9CA3AF" }} />}
      </button>
      {open && (
        <div style={{ padding: "0 10px 8px", fontSize: 11.5, color: "#374151", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 5px" }}>{issue.detail}</p>
          {issue.tip && <p style={{ margin: 0, padding: "5px 8px", background: "rgba(255,255,255,0.6)", borderRadius: 7, fontSize: 11, color: "#059669", fontWeight: 600 }}>💡 {issue.tip}</p>}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function SeoAnalyzer({ title, metaTitle, metaDescription, slug, keywords, bodyHtml }) {
  const [result, setResult] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount — prevents stale setState
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; clearTimeout(debounceRef.current); };
  }, []);

  // Debounced analysis
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      const r = analyze({ title, metaTitle, metaDescription, slug, keywords, bodyHtml });
      setResult(r);
    }, 600);
  }, [title, metaTitle, metaDescription, slug, keywords, bodyHtml]);

  if (!result) return null;

  const { issues, passes, score, categoryScores, wordCount } = result;
  const critCount = issues.filter(i => i.severity === "critical" || i.severity === "error").length;
  const warnCount = issues.filter(i => i.severity === "warning").length;
  const tipCount = issues.filter(i => i.severity === "suggestion" || i.severity === "info").length;

  const tabs = ["all", ...Object.keys(CAT)];
  const filtered = activeTab === "all" ? issues : issues.filter(i => i.category === activeTab);
  const filteredPasses = activeTab === "all" ? passes : passes.filter(i => i.category === activeTab);

  return (
    <div className="meta-box" style={{ overflow: "hidden" }}>
      {/* Header */}
      <button onClick={() => setCollapsed(!collapsed)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "none", background: "linear-gradient(135deg,#F9FAFB,#F3F4F6)", cursor: "pointer", borderBottom: collapsed ? "none" : "1px solid #E5E7EB" }}>
        <Target size={15} style={{ color: "#F5A623" }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 800, color: "#111827" }}>SEO Analysis</span>
        <ScoreRing score={score} size={34} />
        {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>

      {!collapsed && (
        <div style={{ padding: "10px 12px 12px" }}>
          {/* Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <ScoreRing score={score} size={50} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626" }}>
                {score >= 80 ? "Great!" : score >= 50 ? "Needs work" : "Needs attention"}
              </div>
              <div style={{ fontSize: 10.5, color: "#6B7280", marginTop: 1 }}>{wordCount} words · {issues.length} issue{issues.length !== 1 ? "s" : ""} · {passes.length} passed</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {critCount > 0 && <Badge color="#DC2626" bg="#FEF2F2">{critCount} critical</Badge>}
                {warnCount > 0 && <Badge color="#D97706" bg="#FFFBEB">{warnCount} warning{warnCount > 1 ? "s" : ""}</Badge>}
                {tipCount > 0 && <Badge color="#2563EB" bg="#EFF6FF">{tipCount} tip{tipCount > 1 ? "s" : ""}</Badge>}
              </div>
            </div>
          </div>

          {/* Category scores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginBottom: 10 }}>
            {Object.entries(categoryScores).map(([cat, s]) => {
              const c = CAT[cat] || { Icon: BarChart3, label: cat };
              const clr = s >= 80 ? "#059669" : s >= 50 ? "#D97706" : "#DC2626";
              return (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 7, background: activeTab === cat ? "#E5E7EB" : "#F9FAFB", border: "none", cursor: "pointer" }}>
                  <c.Icon size={11} style={{ color: clr }} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#374151", flex: 1, textAlign: "left" }}>{c.label}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: clr }}>{s}</span>
                </button>
              );
            })}
          </div>

          {/* Tab pills */}
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 8 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "3px 8px", borderRadius: 7, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", textTransform: "capitalize",
                  background: activeTab === t ? "#1B1B1B" : "#F3F4F6", color: activeTab === t ? "#fff" : "#6B7280" }}>
                {t === "all" ? `All (${issues.length})` : CAT[t]?.label || t}
              </button>
            ))}
          </div>

          {/* Issues */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 && filteredPasses.length === 0 && (
              <div style={{ textAlign: "center", padding: "12px", color: "#9CA3AF", fontSize: 11.5 }}>No issues here</div>
            )}
            {filtered.map(i => <IssueCard key={i.id} issue={i} />)}
            {filteredPasses.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>✓ Passed ({filteredPasses.length})</div>
                {filteredPasses.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", fontSize: 11, color: "#059669", background: "#ECFDF5", borderRadius: 7, marginBottom: 2 }}>
                    <CheckCircle size={11} /> {p.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SERP Preview (text-only, no HTML injection) */}
          <div style={{ marginTop: 10, padding: "10px 12px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "flex", alignItems: "center", gap: 3 }}>
              <Search size={10} /> Google Preview
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#1a0dab", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(metaTitle || title || "Untitled Post") + " — AbhiCabs"}
            </div>
            <div style={{ fontSize: 12.5, color: "#006621", marginTop: 1 }}>
              {SERP_HOST}/blogs/{slug || "post-slug"}
            </div>
            <div style={{ fontSize: 12.5, color: "#545454", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
              {metaDescription || "No description set — Google will auto-generate a snippet from the page content."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ color, bg, children }) {
  return <span style={{ fontSize: 9.5, fontWeight: 700, color, background: bg, padding: "1px 7px", borderRadius: 20 }}>{children}</span>;
}
