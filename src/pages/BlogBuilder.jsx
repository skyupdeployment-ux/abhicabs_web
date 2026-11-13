import EmojiIcon from "../components/ui/EmojiIcon";
import React, { useState, useRef, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import {
  Bold, Italic, Underline, Link as LinkIcon, Unlink, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon,
  Palette, ChevronDown, ChevronUp, Eye, EyeOff, Home, FileText, Image as MediaIcon, Table,
  Car, LogIn, LogOut, Loader, AlertCircle, CheckCircle, Send, Search,
  Edit3, ArrowLeft, Plus, Upload, Trash2, FileCheck, Settings, Calendar, Globe,
  CircleDot, ChevronsUpDown, Code2, ArrowRight, Users as UsersIcon, Shield, Eye as ViewIcon,
} from "lucide-react";
import { useAuth } from "../context/BlogAuthContext";
import SeoAnalyzer from "../components/SeoAnalyzer";
import PageSeoAnalyzer from "../components/PageSeoAnalyzer";
import ServiceContentForm from "../components/cms/ServiceContentForm";
import { newServiceContent, isTemplatePage, TRIP_MODES, namesForCities, slugifyName, cfgToContent, BUILT_IN_SLUGS } from "../lib/servicePage";
import { SERVICE_LINKS } from "../data/siteLinks";
import { classifyOrigin } from "../data/serviceCoverage";
import { SERVICE_PRESETS, VEHICLE_SUGGESTIONS, parsePresetList, presetLabel } from "../content/servicePresets";
import { BLOGS } from "../data/blogs";
import { refreshLiveBlogs } from "../hooks/useBlogs";
import useCmsBlogs, { resetCmsBlogsCache } from "../hooks/useCmsBlogs";
import { GH_TOKEN, GH_REPO, GH_BRANCH, GH_FILE, fetchBlogsFile } from "../lib/githubBlogs";
import BlogStructureFields from "../components/cms/BlogStructureFields";
import ServiceWorkspace from "../components/cms/ServiceWorkspace";
import { buildServiceChecklist } from "../components/cms/serviceChecklist";
import PublishChecklist, { buildChecklist } from "../components/cms/PublishChecklist";
import BlogLivePreview from "../components/cms/BlogLivePreview";
import { SCHEMA_DEFS, initSchemas, normalizeSchemas, schemaGraphToString, parseJsonLd, extractToData } from "../utils/blogSchema";
import { SITE_ORIGIN } from "../lib/seo/constants.js";
import { getYouTubeId, getEmbedSrc } from "../utils/videoEmbed.js";

// ─── Config ───────────────────────────────────────────────────────────────────
import { API_URL, API_ROOT } from "../lib/apiBase";
const API_BASE = API_URL;

const SITE_BASE = `${SITE_ORIGIN}/blogs/`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (str = "") =>
  str.toLowerCase().trim()
    .replace(/[""''"`]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─── Cloudinary config ────────────────────────────────────────────────────────
const CL_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CL_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const compressAndUpload = (file, { maxW = 1400, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxW) { height = Math.round((height * maxW) / width); width = maxW; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error("Canvas compression failed"));
        const form = new FormData();
        form.append("file", blob, file.name.replace(/\.[^.]+$/, ".webp"));
        form.append("upload_preset", CL_PRESET);
        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CL_CLOUD}/image/upload`,
            { method: "POST", body: form }
          );
          const data = await res.json();
          if (!res.ok) return reject(new Error(`Cloudinary: ${data?.error?.message || `HTTP ${res.status}`}`));
          resolve(data.secure_url);
        } catch (e) { reject(e); }
      }, "image/webp", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });

// ─── sections[]  →  editor HTML ───────────────────────────────────────────────
// Rebuilds the rich-text HTML shown inside the content box from a saved blog.
const partsToHtml = (parts = []) =>
  parts.map((p) => (p.bold ? `<strong>${escapeHtml(p.text)}</strong>` : escapeHtml(p.text))).join("");

const sectionsToHtml = (sections = []) =>
  sections.map((s) => {
    const alignStyle = s.align ? ` style="text-align:${escapeHtml(s.align)}"` : "";
    if (["h1","h2","h3","h4","h5","h6"].includes(s.type))
      return `<${s.type}${alignStyle}>${escapeHtml(s.text || "")}</${s.type}>`;

    if (["h1_with_link","h2_with_link","h3_with_link","h4_with_link","h5_with_link","h6_with_link"].includes(s.type)) {
      const tag = s.type.replace("_with_link", "");
      return `<${tag}>${escapeHtml(s.textBefore || "")} <a href="${escapeHtml(s.href || "#")}" style="color:#F5A623">${escapeHtml(s.linkText || "")}</a> ${escapeHtml(s.textAfter || "")}</${tag}>`;
    }

    if (s.type === "p")
      return `<p${alignStyle}>${s.text || ""}</p>`; // text may already contain inline HTML

    if (s.type === "p_with_bold")
      return `<p>${partsToHtml(s.parts)}</p>`;

    if (s.type === "p_with_link")
      return `<p>${escapeHtml(s.textBefore || "")} <a href="${escapeHtml(s.href || "#")}" style="color:#F5A623">${escapeHtml(s.linkText || "")}</a> ${escapeHtml(s.textAfter || "")}</p>`;

    if (s.type === "p_with_link_bold")
      return `<p>${partsToHtml(s.partsBefore)} <a href="${escapeHtml(s.href || "#")}" style="color:#F5A623">${escapeHtml(s.linkText || "")}</a> ${partsToHtml(s.partsAfter)}</p>`;

    if (s.type === "quote")
      return `<blockquote>${escapeHtml(s.text || "")}</blockquote>`;

    if (s.type === "ul")
      return `<ul>${(s.text || []).map((i) => `<li>${i}</li>`).join("")}</ul>`;

    if (s.type === "ol")
      return `<ol>${(s.text || []).map((i) => `<li>${i}</li>`).join("")}</ol>`;

    if (s.type === "video") {
      const u = escapeHtml(s.embedUrl || "");
      // Non-editable placeholder; htmlToSections turns it back into a video block,
      // and the live page renders the real iframe.
      return `<figure data-video-embed="${u}" contenteditable="false" style="position:relative;margin:1em auto;max-width:720px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;background:#111;display:flex;align-items:center;justify-content:center;color:#fff;font:600 13px system-ui,sans-serif;gap:8px">▶ Video embed${s.caption ? `<figcaption style="position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:#E5E7EB">${escapeHtml(s.caption)}</figcaption>` : ""}</figure>`;
    }

    if (s.type === "image") {
      const alignStyle = s.alignment === "left" ? "margin-right:auto;margin-left:0;" : s.alignment === "right" ? "margin-left:auto;margin-right:0;" : "margin-left:auto;margin-right:auto;";
      const figWidth = s.imgWidth ? `max-width:${s.imgWidth}px;` : "";
      const figAttrs = [
        s.videoUrl   ? ` data-video-url="${escapeHtml(s.videoUrl)}"` : "",
        s.alignment  ? ` data-alignment="${escapeHtml(s.alignment)}"` : "",
        s.filename   ? ` data-filename="${escapeHtml(s.filename)}"` : "",
        s.fileFormat ? ` data-format="${escapeHtml(s.fileFormat)}"` : "",
        s.fileSize   ? ` data-filesize="${escapeHtml(s.fileSize)}"` : "",
        ` style="${alignStyle}${figWidth}"`,
      ].join("");
      const imgStyle = [
        s.imgWidth  ? `width:${s.imgWidth}px;` : "",
        s.imgHeight ? `height:${s.imgHeight}px;` : "",
        (s.imgWidth || s.imgHeight) ? "object-fit:cover;" : "",
      ].join("");
      const imgAttrs = [
        ` src="${escapeHtml(s.src || "")}"`,
        ` alt="${escapeHtml(s.alt || s.caption || "")}"`,
        s.title     ? ` title="${escapeHtml(s.title)}"` : "",
        s.imgWidth  ? ` data-width="${escapeHtml(s.imgWidth)}"` : "",
        s.imgHeight ? ` data-height="${escapeHtml(s.imgHeight)}"` : "",
        imgStyle    ? ` style="${imgStyle}"` : "",
      ].join("");
      return `<figure${figAttrs}><img${imgAttrs} />${s.caption ? `<figcaption>${escapeHtml(s.caption)}</figcaption>` : ""}</figure>`;
    }

    if (s.type === "faq")
    return (
      <div className="space-y-3">
        {(s.items || []).map((item, i) => (
          <div key={i} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-4 py-3 font-semibold text-[14px] text-[#111827] bg-[#F9FAFB]">{item.q}</div>
            <div className="px-4 py-3 text-[14px] text-slate-600 leading-relaxed">{item.a}</div>
          </div>
        ))}
      </div>
    );
  if (s.type === "table") {
      const head = `<thead><tr>${(s.headers || []).map((h) => `<th style="font-weight:700">${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${(s.rows || []).map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<table data-themed="${s.themed ? "1" : "0"}">${head}${body}</table>`;
    }

    return `<p>${escapeHtml(s.text || "")}</p>`;
  }).join("");

// ─── editor HTML  →  sections[] ───────────────────────────────────────────────
// Parses what the user typed back into the section schema the live site renders.
const htmlToSections = (html = "") => {
  if (typeof document === "undefined") return [];
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  const out = [];

  const hasRealText = (el) => (el.textContent || "").replace(/\u00a0/g, " ").trim().length > 0;

  root.childNodes.forEach((node) => {
    // raw text node → paragraph
    if (node.nodeType === 3) {
      const t = node.textContent.trim();
      if (t) out.push({ type: "p", text: t, fontWeight: "font-normal" });
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    const img = node.querySelector ? node.querySelector("img") : null;

    // Video embed placeholder → video block (must come before the figure/img
    // branch, which would otherwise swallow the <figure> as an empty image).
    if (node.getAttribute && node.getAttribute("data-video-embed")) {
      const embedUrl = node.getAttribute("data-video-embed") || "";
      const cap = node.querySelector ? (node.querySelector("figcaption")?.textContent.trim() || "") : "";
      if (embedUrl) out.push({ type: "video", embedUrl, caption: cap });
      return;
    }

    if (/^h[1-6]$/.test(tag)) {
      if (hasRealText(node)) {
        const align = (node.style && node.style.textAlign) || "";
        out.push({ type: tag, text: node.textContent.trim(), fontWeight: "font-bold", ...(align && align !== "left" ? { align } : {}) });
      }
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.querySelectorAll(":scope > li"))
        .map((li) => li.innerHTML.trim())
        .filter((html) => hasRealText({ textContent: html.replace(/<[^>]+>/g, "") }));
      if (items.length) out.push({ type: tag, text: items });
      return;
    }
    if (tag === "blockquote") {
      if (hasRealText(node)) out.push({ type: "quote", text: node.textContent.trim() });
      return;
    }
    if (tag === "figure" || tag === "img" || (img && !hasRealText(node))) {
      const imgEl = tag === "img" ? node : img;
      const src = imgEl?.getAttribute("src") || "";
      const alt = imgEl?.getAttribute("alt") || "";
      const title = imgEl?.getAttribute("title") || "";
      const cap = node.querySelector ? (node.querySelector("figcaption")?.textContent.trim() || "") : "";
      const videoUrl = (tag === "figure" ? node.getAttribute("data-video-url") : null) || "";
      const alignment = (tag === "figure" ? node.getAttribute("data-alignment") : null) || "center";
      const imgWidth = imgEl?.getAttribute("data-width") || imgEl?.style?.width?.replace("px","") || "";
      const imgHeight = imgEl?.getAttribute("data-height") || imgEl?.style?.height?.replace("px","") || "";
      const filename = (tag === "figure" ? node.getAttribute("data-filename") : null) || "";
      const fileFormat = (tag === "figure" ? node.getAttribute("data-format") : null) || "";
      const fileSize = (tag === "figure" ? node.getAttribute("data-filesize") : null) || "";
      if (src) out.push({ type: "image", src, alt, title, caption: cap, videoUrl, alignment, imgWidth, imgHeight, filename, fileFormat, fileSize });
      return;
    }
    if (tag === "dl") {
      // FAQ — definition list: dt=question, dd=answer
      const items = [];
      let cur = null;
      node.childNodes.forEach((ch) => {
        const t = ch.tagName?.toLowerCase();
        if (t === "dt") { cur = { q: ch.textContent.trim(), a: "" }; items.push(cur); }
        else if (t === "dd" && cur) { cur.a = ch.textContent.trim(); }
      });
      if (items.length) out.push({ type: "faq", items });
      return;
    }
    if (tag === "table") {
      const headers = Array.from(node.querySelectorAll("thead th, thead td")).map((c) => c.textContent.trim());
      const bodyRows = Array.from(node.querySelectorAll("tbody tr"));
      const rowSource = bodyRows.length ? bodyRows : Array.from(node.querySelectorAll("tr")).slice(headers.length ? 1 : 0);
      const rows = rowSource.map((tr) => Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent.trim()));
      out.push({ type: "table", headers, rows, themed: node.getAttribute("data-themed") === "1" });
      return;
    }
    // p / div / anything else with content → paragraph (keeps inline HTML)
    if (hasRealText(node) || img) {
      if (img && !hasRealText(node)) {
        out.push({ type: "image", src: img.getAttribute("src") || "", caption: "" });
      } else {
        const align = (node.style && node.style.textAlign) || "";
        out.push({ type: "p", text: node.innerHTML.trim(), fontWeight: "font-normal", ...(align && align !== "left" ? { align } : {}) });
      }
    }
  });

  return out;
};

// ─── Preview renderer (mirrors BlogDetails) ───────────────────────────────────
function PreviewSection({ s, usedH3, onPlayVideo }) {
  if (["h1","h2","h3","h4","h5","h6"].includes(s.type)) {
    const base = slugify(s.text || "");
    const count = (usedH3.get(base) || 0) + 1; usedH3.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    const size = {
      h1: "text-[24px] sm:text-[30px]", h2: "text-[20px] sm:text-[24px]", h3: "text-[16px] sm:text-[18px]",
      h4: "text-[15px] sm:text-[16px]", h5: "text-[13px] sm:text-[14px]", h6: "text-[12px] sm:text-[13px]",
    }[s.type];
    return React.createElement(s.type, { id, className: `scroll-mt-28 ${size} font-bold text-[#111827]`, style: { textAlign: s.align || undefined } }, s.text);
  }
  if (s.type === "quote")
    return <div className="rounded-xl border border-[#F2E6C9] bg-[#FFF8E8] px-4 py-4 text-[14px] text-slate-700"><div className="border-l-4 border-[#F5A623] pl-3 italic leading-relaxed">{s.text}</div></div>;
  if (s.type === "video") {
    const src = getEmbedSrc(s.embedUrl);
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {src ? (
          <div className="rounded-2xl overflow-hidden border border-slate-100" style={{ aspectRatio: "16/9" }}>
            <iframe src={src} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen title={s.caption || "Video"} />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 text-sm" style={{ aspectRatio: "16/9" }}>Invalid video URL</div>
        )}
        {s.caption && <p className="mt-2 text-[13px] text-slate-500 text-center">{s.caption}</p>}
      </div>
    );
  }
  if (s.type === "image") {
    const justify = s.alignment === "left" ? "flex-start" : s.alignment === "right" ? "flex-end" : "center";
    const figStyle = { maxWidth: "100%", ...(s.imgWidth ? { width: s.imgWidth + "px" } : {}) };
    const imgStyle = { width: "100%", height: "auto", display: "block" };
    if (s.imgHeight) { imgStyle.height = s.imgHeight + "px"; imgStyle.objectFit = "cover"; }
    return (
      <div style={{ display: "flex", justifyContent: justify }}>
        <figure className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group" style={figStyle}>
          {s.src ? (
            <div className="relative">
              <img
                src={s.src}
                alt={s.alt || s.caption || ""}
                title={s.title || undefined}
                style={imgStyle}
              />
              {s.videoUrl && getEmbedSrc(s.videoUrl) && (
                <button
                  type="button"
                  onClick={() => onPlayVideo && onPlayVideo(s.videoUrl)}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors"
                  aria-label="Play video"
                >
                  <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" fill="#F5A623" width="26" height="26"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </button>
              )}
            </div>
          ) : null}
          {s.caption && <figcaption className="px-4 py-3 text-[12px] text-slate-500 text-center">{s.caption}</figcaption>}
        </figure>
      </div>
    );
  }
  if (s.type === "ul")
    return <ul className="list-disc list-outside pl-5 space-y-2 text-[14px] text-slate-600">{(s.text || []).map((i, k) => <li key={k} dangerouslySetInnerHTML={{ __html: i }} />)}</ul>;
  if (s.type === "ol") {
    const items = s.text || [];
    const isFaqStyle = items.length > 0 && items.every((item) => {
      const qi = item.indexOf("?");
      return qi > 0 && qi < item.length - 1;
    });
    if (isFaqStyle) {
      const faqItems = items.map((item) => {
        const qi = item.indexOf("?");
        return { q: item.slice(0, qi + 1).trim(), a: item.slice(qi + 1).trim() };
      });
      return (
        <div className="space-y-3">
          {faqItems.map((item, fi) => (
            <div key={fi}>
              <h3 className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]">{`${fi + 1}. `}<span dangerouslySetInnerHTML={{ __html: item.q }} /></h3>
              <p className="text-[14px] leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: item.a }} />
            </div>
          ))}
        </div>
      );
    }
    return <ol className="list-decimal list-outside pl-5 space-y-2 text-[14px] text-slate-600">{items.map((i, k) => <li key={k} dangerouslySetInnerHTML={{ __html: i }} />)}</ol>;
  }
  if (s.type === "faq")
    return (
      <div className="space-y-3">
        {(s.items || []).map((item, fi) => (
          <div key={fi}>
            <h3 className="scroll-mt-28 text-[16px] sm:text-[18px] font-bold text-[#111827]">{`${fi + 1}. ${item.q || item.name}`}</h3>
            <p className="text-[14px] leading-relaxed text-slate-600">{item.a || item.text}</p>
          </div>
        ))}
      </div>
    );
  if (s.type === "table")
    return (
      <div className="overflow-x-auto rounded-xl border border-[#1B1B1B]">
        <table className="w-full text-[14px] text-slate-600 leading-relaxed border-collapse">
          <thead><tr>{(s.headers || []).map((h, i) => <th key={i} className="text-left px-4 py-3 font-bold border border-[#1B1B1B] text-[#111827]" style={{ background: s.themed ? "#e8dfa8" : "#EAF7F0" }}>{h}</th>)}</tr></thead>
          <tbody>{(s.rows || []).map((r, ri) => <tr key={ri} style={{ background: s.themed ? (ri % 2 ? "#f5f0d8" : "#faf7ec") : (ri === 0 && !s.headers?.length ? "#EAF7F0" : "#fff") }}>{r.map((c, ci) => ri === 0 && !s.headers?.length ? <td key={ci} className="px-4 py-2.5 border border-[#1B1B1B] font-bold text-[#111827]">{c}</td> : <td key={ci} className="px-4 py-2.5 border border-[#1B1B1B] text-slate-600">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  return <p className="text-[14px] leading-relaxed text-slate-600" style={{ textAlign: s.align || undefined }} dangerouslySetInnerHTML={{ __html: s.text }} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Enter your email and password to continue."); return; }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) setError(result.message || "Login failed. Check your credentials.");
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        @keyframes cms-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes cms-pulse { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }
        .cms-login-input { width:100%; padding: 12px 14px; font-size: 14px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; outline: none; transition: all 0.2s; }
        .cms-login-input:focus { border-color: #F5A623; background: #fff; box-shadow: 0 0 0 3px rgba(245,166,35,0.12); }
      `}</style>

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[420px] flex-col items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B1B1B 0%, #0a0a0a 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(245,166,35,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(245,166,35,0.05) 0%, transparent 50%)" }} />
        <div className="relative z-10 text-center px-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg, #F5A623, #E09000)", animation: "cms-float 4s ease-in-out infinite" }}>
            <Car size={36} className="text-white" />
          </div>
          <h1 className="text-[32px] font-extrabold text-white tracking-tight">AbhiCabs</h1>
          <p className="text-[15px] text-white/40 font-semibold uppercase tracking-[0.25em] mt-1">Content Management</p>
          <div className="mt-10 space-y-3">
            {["Edit pages in real time", "Publish blogs instantly", "Upload images & videos", "Manage all content"].map((t, i) => (
              <div key={t} className="flex items-center gap-3 text-white/60 text-[13.5px]" style={{ animation: `cms-pulse 3s ease-in-out ${i * 0.5}s infinite` }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" /> {t}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 text-[11px] text-white/20 font-medium">© {new Date().getFullYear()} AbhiCabs</div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ background: "#FAFAFA" }}>
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl mb-3" style={{ background: "linear-gradient(135deg, #F5A623, #E09000)" }}>
              <Car size={26} className="text-white" />
            </div>
            <h1 className="text-[22px] font-extrabold text-[#111827]">AbhiCabs CMS</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-[24px] font-extrabold text-[#111827]">Welcome back</h2>
            <p className="text-[14px] text-[#9CA3AF] mt-1">Sign in to manage your website content</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB]/60 p-7" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-[13px] mb-5">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1.5 text-[12px] font-bold text-[#374151]">Email address</label>
                <input type="email" value={form.email} placeholder="admin@abhicabs.in" autoFocus
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="cms-login-input" />
              </div>
              <div>
                <label className="block mb-1.5 text-[12px] font-bold text-[#374151]">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={form.password} placeholder="••••••••••"
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="cms-login-input" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] text-white transition-all disabled:opacity-60"
                style={{ background: loading ? "#9CA3AF" : "linear-gradient(135deg, #F5A623, #E09000)", boxShadow: loading ? "none" : "0 4px 14px rgba(245,166,35,0.35)" }}>
                {loading ? <><Loader size={16} className="animate-spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>
          </div>
          <p className="text-center text-[11px] text-[#D1D5DB] mt-5 font-medium">Authorized AbhiCabs team members only</p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOG PICKER
// ═════════════════════════════════════════════════════════════════════════════
function BlogPicker({ onSelect, onPages, onDeleteBlog }) {
  const { user, logout, canEdit, isAdmin, canManageRedirects } = useAuth();
  const [query, setQuery] = useState("");
  const { blogs: BLOGS_LIST, source: blogSource, status: blogStatus, error: blogError, refresh: refreshBlogs } = useCmsBlogs();
  const filtered = BLOGS_LIST.filter((b) =>
    b.headline?.toLowerCase().includes(query.toLowerCase()) ||
    b.title?.toLowerCase().includes(query.toLowerCase()) ||
    b.slug?.toLowerCase().includes(query.toLowerCase()) ||
    b.category?.toLowerCase().includes(query.toLowerCase()),
  );

  const pickerNavItems = [
    { id: "pages", label: "Pages", Icon: Globe,     active: false, onClick: () => onPages?.() },
    { id: "blog",  label: "Blogs", Icon: FileText,  active: true,  onClick: () => {} },
    { id: "media", label: "Media", Icon: MediaIcon, active: false, onClick: () => onSelect(null) },
    ...(canManageRedirects ? [{ id: "redirects", label: "Redirects", Icon: ArrowRight, active: false, onClick: () => onSelect(null) }] : []),
    ...(isAdmin ? [{ id: "users", label: "Users", Icon: UsersIcon, active: false, onClick: () => onSelect(null) }] : []),
  ];

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "'Urbanist', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-[184px] shrink-0 flex flex-col text-[#F3F4F6] h-screen sticky top-0" style={{ background: "linear-gradient(160deg,#18181B 0%,#0f0f11 40%,#09090B 100%)" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg,#F5A623,#E09000)", boxShadow: "0 2px 10px rgba(245,166,35,0.4)" }}><Car size={16} className="text-[#111827]" /></div>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight text-white">AbhiCabs</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#F5A623]">CMS</div>
          </div>
        </div>
        <nav className="py-3 px-2.5 flex-1 space-y-1 overflow-y-auto">
          {pickerNavItems.map(({ id, label, Icon, active, onClick }) => (
            <button key={id} onClick={onClick}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] rounded-xl transition-all"
              style={active
                ? { background: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700, boxShadow: "inset 3px 0 0 #F5A623" }
                : { color: "#9CA3AF" }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateX(2px)"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; } }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <a href="/admin/site-settings" className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] hover:text-white transition-colors mb-2.5">
            <Settings size={12} /> Site Settings
          </a>
          <div className="text-[11px] text-[#9CA3AF] truncate mb-1.5">{user?.email}</div>
          <button onClick={logout} className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] hover:text-white transition-colors">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto" style={{ background: "#F9FAFB" }}>
        {/* top bar */}
        <div className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-[19px] font-extrabold text-[#111827] tracking-tight">CMS</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#ECFDF5", color: "#059669" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />{user?.email || "Logged in"}
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full px-6 py-10">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">What would you like to do?</h2>
          <p className="text-sm text-slate-500 mb-8">Create a new blog post, or open an existing one to edit.</p>
          {canEdit ? (
        <div className="mb-8">
            <button onClick={() => onSelect(null)}
              className="w-full mb-3 flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-[#1B1B1B]/30 bg-[#ECFDF5] hover:border-[#1B1B1B] hover:bg-[#ECFDF5] transition-all group text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: "linear-gradient(135deg,#1B1B1B,#111111)" }}>
                <Plus size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-[#1B1B1B] text-base">Blank post</div>
                <div className="text-sm text-slate-500 mt-0.5">Start from scratch</div>
              </div>
            </button>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-5">Or start from a template</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { emoji: "→", label: "Route Guide", cat: "Routes", desc: "City A → City B travel guide", body: "<h2>Route Overview</h2><p>Distance, travel time, and the best way to get there.</p><h2>By Car</h2><p>Road conditions, toll costs, and stops along the way.</p><h2>What to See</h2><p>Places worth visiting on this route.</p><h2>Fare Estimate</h2><p>What to expect for a one-way cab on this route.</p>" },
                { emoji: "◆", label: "Destination Guide", cat: "Destinations", desc: "Complete city/place guide", body: "<h2>Why Visit</h2><p>What makes this destination special.</p><h2>Best Time to Go</h2><p>Weather and seasonal advice.</p><h2>How to Get There</h2><p>By road, rail, and air.</p><h2>Top Things to Do</h2><p>Must-see attractions and experiences.</p><h2>Where to Stay</h2><p>Accommodation options for every budget.</p>" },
                { emoji: "↗", label: "Airport Guide", cat: "Airport Transfers", desc: "Airport transfer & tips", body: "<h2>Airport Overview</h2><p>Terminals, layout, and what to know before you land.</p><h2>Getting To & From the Airport</h2><p>Cab, bus, metro — all your options compared.</p><h2>Cab Booking Tips</h2><p>How to book a reliable airport transfer.</p><h2>Fares & Timing</h2><p>What the ride costs and how long it takes.</p>" },
                { emoji: "★", label: "Travel Tips", cat: "Travel Tips", desc: "Advice & how-to", body: "<h2>The Short Version</h2><p>Key takeaways in a few lines.</p><h2>Tip 1</h2><p>Explanation and why it matters.</p><h2>Tip 2</h2><p>Explanation and why it matters.</p><h2>Tip 3</h2><p>Explanation and why it matters.</p><h2>Wrapping Up</h2><p>Final thoughts and a call to action.</p>" },
                { emoji: "◎", label: "Cab Comparison", cat: "Cab Services", desc: "Compare cab options", body: "<h2>What We're Comparing</h2><p>The options and why they matter.</p><h2>Option A</h2><p>Features, pricing, best for.</p><h2>Option B</h2><p>Features, pricing, best for.</p><h2>Side-by-Side</h2><p>A quick comparison table.</p><h2>Our Verdict</h2><p>Which one to pick and when.</p>" },
                { emoji: "#", label: "Listicle", cat: "Travel Tips", desc: "Top 5/10 list post", body: "<h2>1. First Item</h2><p>Why it's on the list.</p><h2>2. Second Item</h2><p>Why it's on the list.</p><h2>3. Third Item</h2><p>Why it's on the list.</p><h2>4. Fourth Item</h2><p>Why it's on the list.</p><h2>5. Fifth Item</h2><p>Why it's on the list.</p>" },
              ].map((tpl) => (
                <button key={tpl.label} type="button" onClick={() => {
                  onSelect({
                    _template: true,
                    title: "", headline: "", slug: "", description: "",
                    category: tpl.cat, tags: [], author: "AbhiCabs",
                    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    heroImage: "", sections: [],
                    _templateBody: tpl.body,
                  });
                }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#1B1B1B] hover:bg-slate-50 transition-all text-left">
                  <span className="text-xl flex-shrink-0">{tpl.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#111] truncate">{tpl.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{tpl.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full mb-8 flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-200"><Plus size={22} className="text-slate-400" /></div>
            <div><div className="font-bold text-slate-400 text-base">Create new blog</div><div className="text-sm text-slate-400 mt-0.5">Viewers cannot create blogs</div></div>
          </div>
        )}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Edit existing ({BLOGS_LIST.length} blogs)</h3>
              {blogStatus === "loading" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Loading from GitHub…</span>}
              {blogStatus !== "loading" && blogSource === "github" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>● Live from GitHub</span>}
              <button onClick={refreshBlogs} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2">Refresh</button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search blogs…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1B1B1B] w-44" />
            </div>
          </div>
          {blogError && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-[12.5px] leading-relaxed" style={{ background: blogStatus === "error" ? "#FEF2F2" : "#FFFBEB", borderColor: blogStatus === "error" ? "#FECACA" : "#FDE68A", color: blogStatus === "error" ? "#991B1B" : "#92400E" }}>
              {blogStatus === "error" && <b>Couldn't load the live list. </b>}{blogError}
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">{BLOGS_LIST.length === 0 ? "No blogs published yet. Create one above — it appears here once it's published." : <>No blogs match "{query}"</>}</div>
          ) : (
            Object.entries(
              filtered.reduce((acc, b) => {
                const cat = b.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(b);
                return acc;
              }, {})
            ).map(([category, blogs]) => (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>{category}</span>
                  <span className="text-[11px] text-slate-400">{blogs.length} blog{blogs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {blogs.map((blog) => (
                    <div key={blog.id}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 transition-all group text-left">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                        {blog.heroImage || blog.image
                          ? <img src={blog.heroImage || blog.image} alt={blog.headline || blog.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-slate-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{blog.headline || blog.title}</div>
                        <div className="text-[11px] text-[#1B1B1B] font-mono truncate mt-0.5 opacity-70">{SITE_BASE}{blog.slug}</div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => onSelect(blog)} title="Edit blog"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:border-[#F5A623] hover:text-[#F5A623] hover:bg-[#FFF8E6] transition-all">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => {
                            if (!window.confirm(`Delete "${blog.headline || blog.title}"? This will remove it from the published blogs. This action cannot be undone.`)) return;
                            onDeleteBlog?.(blog);
                          }} title="Delete blog"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TOOLBAR
// ═════════════════════════════════════════════════════════════════════════════
const SWATCHES = ["#111827", "#1B1B1B", "#F5A623", "#1B1B1B", "#b32d2e", "#6b7280", "#ffffff"];

function ToolbarButton({ title, onClick, active, children, label }) {
  return (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`nv-toolbtn ${active ? "active" : ""}`}
      style={{ position: "relative" }}>
      {children}
      {label && <span style={{ position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)", fontSize: 7, fontWeight: 800, color: active ? "#fff" : "#C4C8CC", letterSpacing: "0.03em" }}>{label}</span>}
    </button>
  );
}

function Toolbar({ exec, onLink, onUnlink, onImage, onVideo, onTable, onFaq, format, setFormat, color, setColor, imageUploading, activeFormats }) {
  const [colorOpen, setColorOpen] = useState(false);
  const af = activeFormats || { bold: false, italic: false, underline: false, link: false };
  const sep = <span style={{ width: 1, alignSelf: "stretch", margin: "4px 6px", background: "linear-gradient(180deg,transparent,#E5E7EB,transparent)", borderRadius: 1 }} />;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, padding: "10px 14px", borderBottom: "1px solid #F3F4F6", background: "linear-gradient(180deg,#FAFAFA,#F6F6F8)", borderRadius: "18px 18px 0 0" }}>
      {/* Format / Paragraph + H1–H6 */}
      <div className="relative">
        <select
          value={format}
          onChange={(e) => { setFormat(e.target.value); }}
          className="h-9 pl-3 pr-8 text-[13px] font-semibold text-[#374151] bg-white border border-[#E5E7EB] rounded-[10px] appearance-none cursor-pointer focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A62320]"
          style={{ minWidth: 130, transition: "all 0.2s" }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#374151]" />
      </div>
      {sep}

      <ToolbarButton title="Bold (Ctrl+B)" active={af.bold} onClick={() => exec("bold")}><Bold size={16} /></ToolbarButton>
      <ToolbarButton title="Italic (Ctrl+I)" active={af.italic} onClick={() => exec("italic")}><Italic size={16} /></ToolbarButton>
      <ToolbarButton title="Underline (Ctrl+U)" active={af.underline} onClick={() => exec("underline")}><Underline size={16} /></ToolbarButton>
      {sep}

      <ToolbarButton title="Bulleted list" onClick={() => exec("insertUnorderedList")}><List size={16} /></ToolbarButton>
      <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered size={16} /></ToolbarButton>
      {sep}

      <ToolbarButton title="Align left" onClick={() => exec("justifyLeft")}><AlignLeft size={16} /></ToolbarButton>
      <ToolbarButton title="Align center" onClick={() => exec("justifyCenter")}><AlignCenter size={16} /></ToolbarButton>
      <ToolbarButton title="Align right" onClick={() => exec("justifyRight")}><AlignRight size={16} /></ToolbarButton>
      <ToolbarButton title="Justify" onClick={() => exec("justifyFull")}><AlignJustify size={16} /></ToolbarButton>
      {sep}

      <ToolbarButton title="Insert link" active={af.link} onClick={onLink}><LinkIcon size={16} /></ToolbarButton>
      <ToolbarButton title="Remove link" onClick={onUnlink}><Unlink size={16} /></ToolbarButton>
      {sep}

      {/* Text color */}
      <div className="relative">
        <ToolbarButton title="Text color" onClick={() => setColorOpen((v) => !v)}>
          <span className="flex flex-col items-center leading-none">
            <Palette size={15} />
            <span className="w-4 h-[3px] mt-[2px] rounded-sm" style={{ background: color }} />
          </span>
        </ToolbarButton>
        {colorOpen && (
          <div style={{ position: "absolute", zIndex: 30, marginTop: 4, padding: 12, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "cms-fade-in 0.15s ease-out" }} onMouseDown={(e) => e.preventDefault()}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Text Color</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 10 }}>
              {SWATCHES.map((c) => (
                <button key={c} type="button" title={c}
                  onClick={() => { setColor(c); exec("foreColor", c); setColorOpen(false); }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: color === c ? "2.5px solid #F5A623" : "1.5px solid #E5E7EB", background: c, cursor: "pointer", transition: "all 0.15s", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="color" value={color}
                onChange={(e) => { setColor(e.target.value); exec("foreColor", e.target.value); }}
                style={{ width: 32, height: 32, cursor: "pointer", borderRadius: 8, border: "1.5px solid #E5E7EB", padding: 1 }} />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} onBlur={() => exec("foreColor", color)}
                style={{ flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontFamily: "'JetBrains Mono',monospace" }} />
            </div>
          </div>
        )}
      </div>
      {sep}

      <ToolbarButton title="Insert image" onClick={onImage}>
        {imageUploading ? <Loader size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </ToolbarButton>
      <ToolbarButton title="Insert video (YouTube or Vimeo)" onClick={onVideo}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="15" height="14" rx="2" /><path d="M17 9l5-3v12l-5-3" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Insert table" onClick={onTable}><Table size={16} /></ToolbarButton>
      <ToolbarButton title="Insert FAQ block (Q&A)" onClick={onFaq}>
        <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1, letterSpacing: "0.03em", padding: "0 2px" }}>FAQ</span>
      </ToolbarButton>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOG EDITOR  (WordPress-style)
// ═════════════════════════════════════════════════════════════════════════════
// ── "Add block" bar — always visible under the toolbar. Text blocks are inserted below the line
// you are on (cursor lands inside the new block); table / FAQ / image / video use their own flows.
// onMouseDown preventDefault keeps the editor's cursor from being lost when a button is pressed.
const BLOCK_BUTTONS = [
  { id: "p", label: "Paragraph" }, { id: "h2", label: "Heading 2" }, { id: "h3", label: "Heading 3" }, { id: "h4", label: "Heading 4" },
  { id: "ul", label: "Bullet list" }, { id: "ol", label: "Numbered list" }, { id: "quote", label: "Quote" },
  { id: "table", label: "Table" }, { id: "faq", label: "FAQ" }, { id: "image", label: "Image" }, { id: "video", label: "Video" },
];
function BlockAdder({ onAdd }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAFAFA] border-t border-[#EDEDED] overflow-x-auto" role="toolbar" aria-label="Add a block">
      <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#9CA3AF] mr-1">+ Add block</span>
      {BLOCK_BUTTONS.map((b) => (
        <button key={b.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onAdd(b.id)}
          className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#F5A623] hover:bg-[#FFF8E6] hover:text-[#111] transition-colors">
          {b.label}
        </button>
      ))}
    </div>
  );
}

function BlogEditor({ editingBlog, onBack }) {
  const { blogs: cmsBlogs } = useCmsBlogs();
  const { user, logout, canEdit, canPublish, isAdmin, canManageUsers, canManageRedirects } = useAuth();
  const isEditMode = !!editingBlog;

  const bodyRef = useRef(null);
  const fileInputRef = useRef(null);          // content image
  const heroInputRef = useRef(null);          // featured image
  const savedSelection = useRef(null);

  const [format, setFormat] = useState("p");
  const [color, setColor] = useState("#111827");
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, link: false });
  const [imageUploading, setImageUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroPreview, setHeroPreview] = useState("");

  const [previewMode, setPreviewMode] = useState(false);
  const [linkPopover, setLinkPopover] = useState({ open: false, url: "", text: "" });
  const [videoPopover, setVideoPopover] = useState({ open: false, url: "" });
  const [wordCount, setWordCount] = useState(0);
  const linkInputRef = useRef(null);
  const [activeNav, setActiveNav] = useState("blog");
  const [showSettings, setShowSettings] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [showSchema, setShowSchema] = useState(true);
  const [showJsonLd, setShowJsonLd] = useState(false);
  const [collapsedSchemas, setCollapsedSchemas] = useState({});
  const [schemas, setSchemas] = useState(() => initSchemas());
  const [imageVideoPopup, setImageVideoPopup] = useState(null); // { videoUrl } for content image lightbox
  const [slugEditing, setSlugEditing] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // ── Media library (persisted in localStorage) ─────────────────────────────
  const MEDIA_KEY = "abhicabs_media_library";
  const loadMediaLib = () => {
    try { return JSON.parse(localStorage.getItem(MEDIA_KEY) || "[]"); } catch { return []; }
  };
  const [mediaLibrary, setMediaLibrary] = useState(loadMediaLib);
  const addToMediaLib = (entry) => {
    setMediaLibrary((prev) => {
      if (prev.find((m) => m.url === entry.url)) return prev; // no duplicates
      const next = [entry, ...prev];
      try { localStorage.setItem(MEDIA_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };
  const [pendingImageUrl, setPendingImageUrl] = useState(null); // url of just-uploaded content image awaiting meta
  const [contentImageMeta, setContentImageMeta] = useState({ alt: "", title: "", caption: "", description: "", videoUrl: "" });
  const [bodySnapshot, setBodySnapshot] = useState(""); // snapshot of editor HTML for preview

  const [publishStatus, setPublishStatus] = useState(null);
  const [publishMsg, setPublishMsg] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [currentDraftKey, setCurrentDraftKey] = useState(null);

  const [meta, setMeta] = useState({
    title: "", metaTitle: "", description: "", keywords: "", slug: "",
    category: "Cab Services", author: "AbhiCabs",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    heroImage: "", imageAlt: "", imageTitle: "", imageCaption: "", imageDescription: "", videoUrl: "", tags: "",
  });

  const editingBlogId = useRef(editingBlog?.id ?? null);
  const editingBlogOriginalSlug = useRef(editingBlog?.slug ?? "");
  const initialHtml = useRef("");

  // Build initial body + meta from the blog being edited or a template
  if (initialHtml.current === "" && editingBlog) {
    if (editingBlog._template && editingBlog._templateBody) {
      initialHtml.current = editingBlog._templateBody;
    } else {
      initialHtml.current = sectionsToHtml(editingBlog.sections || []);
    }
  }

  useEffect(() => { loadDrafts(); }, []);

  // ── Auto-save blog draft every 30 seconds ──
  const autoSaveRef = useRef(null);
  const autoSaveBlog = () => {
    if (typeof localStorage === "undefined") return;
    const body = bodyRef.current ? bodyRef.current.innerHTML : "";
    if (!body && !meta.title) return; // nothing to save
    const key = currentDraftKey || `draft_autosave_blog`;
    localStorage.setItem(key, JSON.stringify({ meta, body, schemas, savedAt: new Date().toISOString(), auto: true }));
    if (!currentDraftKey) setCurrentDraftKey(key);
  };
  useEffect(() => {
    autoSaveRef.current = setInterval(autoSaveBlog, 30000);
    const handleUnload = () => autoSaveBlog();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(autoSaveRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [meta, schemas]);

  useEffect(() => {
    if (!editingBlog) return;
    editingBlogId.current = editingBlog.id;
    editingBlogOriginalSlug.current = editingBlog.slug || "";
    setMeta({
      title:            editingBlog.headline       || editingBlog.title || "",
      metaTitle:        editingBlog.title          || "",
      description:      editingBlog.description    || "",
      keywords:         editingBlog.keywords       || "",
      slug:             editingBlog.slug           || "",
      category:         editingBlog.category       || "Cab Services",
      author:           editingBlog.author         || "AbhiCabs",
      date:             editingBlog.date           || "",
      heroImage:        editingBlog.heroImage      || editingBlog.image || "",
      imageAlt:         editingBlog.imageAlt       || editingBlog.title || "",
      imageTitle:       editingBlog.imageTitle     || "",
      imageCaption:     editingBlog.imageCaption   || "",
      imageDescription: editingBlog.imageDescription || "",
      videoUrl:         editingBlog.videoUrl         || "",
      tags:             (editingBlog.tags || []).join(", "),
    });
    setSchemas(normalizeSchemas(editingBlog.schemas));
    // Seed the image→video map from existing sections
    (editingBlog.sections || []).forEach((s) => {
      if (s.type === "image" && s.src && s.videoUrl) {
        imageVideoMapRef.current[s.src] = s.videoUrl;
      }
    });
    const html = (editingBlog._template && editingBlog._templateBody)
      ? editingBlog._templateBody
      : sectionsToHtml(editingBlog.sections || []);
    if (bodyRef.current) bodyRef.current.innerHTML = html;
  }, [editingBlog]);

  // ── Rich-text commands ──────────────────────────────────────────────────────
  const focusBody = () => { if (bodyRef.current) bodyRef.current.focus(); };

  // The toolbar controls (especially the native <select>) steal focus from the
  // editor, which collapses/loses the caret — so execCommand would then run
  // against nothing (headings wouldn't stick, unlink would have no target).
  // We continuously remember the last caret/selection that was inside the
  // editor and restore it right before running any command.
  const selectionInsideBody = (range) =>
    bodyRef.current && range && bodyRef.current.contains(range.commonAncestorContainer);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (selectionInsideBody(r)) savedSelection.current = r.cloneRange();
    }
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedSelection.current && sel) {
      try { sel.removeAllRanges(); sel.addRange(savedSelection.current); } catch (_) {}
    }
  };

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && selectionInsideBody(sel.getRangeAt(0))) {
        savedSelection.current = sel.getRangeAt(0).cloneRange();
        syncActiveFormats();
        syncFormatState();
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const exec = useCallback((cmd, value = null) => {
    focusBody();
    restoreSelection();
    try { document.execCommand("styleWithCSS", false, true); } catch (_) {}
    document.execCommand(cmd, false, value);
    saveSelection();
    syncFormatState();
    syncActiveFormats();
  }, []);

  // Top-level block (direct child of the editor) that contains `node`.
  const topBlockOf = (node) => {
    const el = bodyRef.current;
    let b = node && (node.nodeType === 1 ? node : node.parentElement);
    while (b && b.parentElement !== el) b = b.parentElement;
    return b && b.parentElement === el ? b : null;
  };

  // The toolbar dropdown follows the block under the caret (read from the DOM, so it is the
  // same in every browser): H1–H6 → that heading, anything else → Paragraph.
  const syncFormatState = () => {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !selectionInsideBody(sel.getRangeAt(0))) return;
      const tag = (topBlockOf(sel.getRangeAt(0).startContainer)?.tagName || "P").toLowerCase();
      setFormat(/^h[1-6]$/.test(tag) ? tag : "p");
    } catch (_) {}
  };

  // Does the current selection sit inside an <a> tag? (queryCommandState has
  // no reliable built-in "link" command, so this walks up the DOM instead.)
  const isSelectionInLink = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !bodyRef.current) return false;
    let node = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentElement; // text node -> element
    while (node && node !== bodyRef.current) {
      if (node.tagName === "A") return true;
      node = node.parentElement;
    }
    return false;
  };

  // Reflects the formatting under the current caret/selection (bold, italic,
  // underline, link) so the toolbar buttons show as "active" whenever the
  // cursor is on text that already has that formatting.
  const syncActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        link: isSelectionInLink(),
      });
    } catch (_) {}
  };

  // Guarantee the editor's text always lives inside a block element. Typing into
  // a brand-new (empty) contentEditable produces a bare text node with no block
  // wrapper, and formatBlock can't turn a bare text node into a heading — it
  // wipes it and the format never sticks. Seeding a <p> (and making Enter create
  // <p>) keeps headings working.
  const ensureEditable = () => {
    const el = bodyRef.current;
    if (!el) return;
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (_) {}
    const html = el.innerHTML.trim();
    if (html === "" || html === "<br>") {
      el.innerHTML = "<p><br></p>";
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(el.firstChild);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      savedSelection.current = r.cloneRange();
    }
  };

  const onEditorFocus = () => { ensureEditable(); ensureTrailingParagraph(); };

  // Bare text / inline nodes sitting directly in the editor (typed into a fresh editor, or pasted)
  // can't be converted to a heading — wrap each run of them in a <p> first.
  const wrapStrayInline = () => {
    const el = bodyRef.current;
    if (!el) return;
    const INLINE = new Set(["SPAN", "A", "B", "I", "U", "STRONG", "EM", "BR", "FONT", "SUB", "SUP", "MARK", "CODE"]);
    let run = [];
    const flush = () => {
      if (run.length && !run.every((n) => n.nodeType === 3 && !n.textContent.trim())) {
        const p = document.createElement("p");
        run[0].before(p);
        run.forEach((n) => p.appendChild(n));
      }
      run = [];
    };
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3 || (n.nodeType === 1 && INLINE.has(n.tagName))) run.push(n); else flush();
    });
    flush();
  };

  // Paragraph / Heading 1–6. Converts EVERY text block the selection touches (one block when it is
  // just a caret), leaves lists, tables, images, FAQs etc. alone, and keeps the caret where it was.
  const handleFormatChange = (val) => {
    const el = bodyRef.current;
    if (!el) return;

    // Read the position BEFORE focusing: focusing a contentEditable programmatically can jump the
    // caret to the start of the document, which made the dropdown change the FIRST block instead
    // of the one being edited (so headings and paragraphs couldn't be mixed).
    const saved = savedSelection.current;
    const liveSel = window.getSelection();
    const range = (saved && selectionInsideBody(saved)) ? saved.cloneRange()
      : (liveSel && liveSel.rangeCount && selectionInsideBody(liveSel.getRangeAt(0)) ? liveSel.getRangeAt(0).cloneRange() : null);

    setFormat(val);
    // Keep the boundary as plain values: wrapping stray text in a <p> moves the text node, and the
    // browser would otherwise snap a live Range to the editor itself (losing the position).
    const pts = range && { sc: range.startContainer, so: range.startOffset, ec: range.endContainer, eo: range.endOffset };
    el.focus();
    ensureEditable();
    wrapStrayInline();
    if (!pts) return;
    const range2 = document.createRange();
    try { range2.setStart(pts.sc, pts.so); range2.setEnd(pts.ec, pts.eo); } catch (_) { return; }

    const first = topBlockOf(range2.startContainer);
    const last = topBlockOf(range2.endContainer) || first;
    if (!first) return;
    const kids = Array.from(el.children);
    const blocks = kids.slice(kids.indexOf(first), kids.indexOf(last) + 1);
    const CONVERTIBLE = /^(P|DIV|H[1-6])$/;

    // remember where the selection ends so it survives the tag swap
    const ends = { sc: range2.startContainer, so: range2.startOffset, ec: range2.endContainer, eo: range2.endOffset };
    const mapNode = (node, off, from, to) => (node === from ? [to, Math.min(off, to.childNodes.length)] : [node, off]);

    blocks.filter((b) => CONVERTIBLE.test(b.tagName)).forEach((block) => {
      if (block.tagName === val.toUpperCase()) return;
      const newEl = document.createElement(val);
      Array.from(block.attributes).forEach((a) => { if (a.name === "style") newEl.setAttribute("style", a.value); }); // keeps text-align
      while (block.firstChild) newEl.appendChild(block.firstChild);
      if (!newEl.firstChild) newEl.appendChild(document.createElement("br"));
      block.replaceWith(newEl);
      [ends.sc, ends.so] = mapNode(ends.sc, ends.so, block, newEl);
      [ends.ec, ends.eo] = mapNode(ends.ec, ends.eo, block, newEl);
    });

    try {
      const r = document.createRange();
      r.setStart(ends.sc, ends.so);
      r.setEnd(ends.ec, ends.eo);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      savedSelection.current = r.cloneRange();
    } catch (_) {}
    syncFormatState();
    setBodySnapshot(el.innerHTML);
  };

  // Enter at the END of a heading always starts a normal paragraph (browsers disagree on this, and
  // some keep the heading style). Enter in the middle of a heading still splits it as usual.
  const onEditorKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = bodyRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount || !sel.isCollapsed) return;
    wrapStrayInline();
    const r = sel.getRangeAt(0);
    const block = topBlockOf(r.startContainer);
    if (!block || !/^H[1-6]$/.test(block.tagName)) return;
    const tail = document.createRange();
    tail.selectNodeContents(block);
    tail.setStart(r.endContainer, r.endOffset);
    if (tail.toString().length > 0) return; // caret is mid-heading → default split
    e.preventDefault();
    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));
    block.after(p);
    const nr = document.createRange();
    nr.setStart(p, 0);
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
    savedSelection.current = nr.cloneRange();
    syncFormatState();
    setBodySnapshot(el.innerHTML);
  };

  // Always keep an empty paragraph at the very end so there is somewhere to keep typing after a
  // table, image, FAQ, video or list. (Empty paragraphs are ignored when the post is saved.)
  const ensureTrailingParagraph = () => {
    const el = bodyRef.current;
    if (!el) return;
    const last = el.lastElementChild;
    if (!last || !/^(P|DIV|H[1-6])$/.test(last.tagName)) {
      const p = document.createElement("p");
      p.appendChild(document.createElement("br"));
      el.appendChild(p);
    }
  };
  useEffect(() => { ensureTrailingParagraph(); }, [bodySnapshot]);

  // Add a block below the line the caret is on. An empty line is reused instead of leaving a gap.
  const insertBlock = (kind) => {
    if (kind === "table") return openTablePicker();
    if (kind === "faq") return insertFaq();
    if (kind === "image") return onImageClick();
    if (kind === "video") return openVideo();
    const el = bodyRef.current;
    if (!el) return;
    ensureEditable();
    wrapStrayInline();
    const saved = savedSelection.current;
    const anchor = saved && selectionInsideBody(saved) ? topBlockOf(saved.endContainer) : null;

    const br = () => document.createElement("br");
    let node, caretTarget;
    if (kind === "ul" || kind === "ol") {
      node = document.createElement(kind);
      caretTarget = document.createElement("li");
      caretTarget.appendChild(br());
      node.appendChild(caretTarget);
    } else {
      node = document.createElement(kind === "quote" ? "blockquote" : kind);
      node.appendChild(br());
      caretTarget = node;
    }

    const isEmptyTextBlock = anchor && /^(P|DIV|H[1-6])$/.test(anchor.tagName) && !anchor.textContent.replace(/\u00a0/g, " ").trim() && !anchor.querySelector("img");
    if (anchor && isEmptyTextBlock) anchor.replaceWith(node);
    else if (anchor) anchor.after(node);
    else el.appendChild(node);

    el.focus({ preventScroll: true });
    const r = document.createRange();
    r.setStart(caretTarget, 0);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    savedSelection.current = r.cloneRange();
    ensureTrailingParagraph();
    syncFormatState();
    setBodySnapshot(el.innerHTML);
    try { node.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {}
  };

  const onLink = () => {
    focusBody();
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel?.toString() || "";
    setLinkPopover({ open: true, url: "", text: selectedText });
    setTimeout(() => linkInputRef.current?.focus(), 100);
  };

  const insertLinkFromPopover = () => {
    const url = linkPopover.url.trim();
    if (!url) return;
    restoreSelection();
    document.execCommand("createLink", false, url);
    if (bodyRef.current) {
      bodyRef.current.querySelectorAll("a:not([data-styled])").forEach((a) => {
        a.style.color = "#F5A623";
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        a.setAttribute("data-styled", "1");
      });
    }
    saveSelection();
    setLinkPopover({ open: false, url: "", text: "" });
  };

  const onUnlink = () => {
    focusBody();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !bodyRef.current) return;

    // Find the <a> the caret/selection is inside of.
    let node = sel.anchorNode;
    let a = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
    while (a && a !== bodyRef.current && a.tagName !== "A") a = a.parentElement;

    if (!a || a.tagName !== "A") {
      // Selection isn't inside a single link (e.g. spans several) — fall back
      // to the browser's own command for that case.
      document.execCommand("unlink");
      saveSelection();
      syncFormatState();
      syncActiveFormats();
      return;
    }

    // Manually unwrap the <a>: replace it with its own contents. This is more
    // reliable than execCommand("unlink"), which can silently do nothing
    // depending on exactly how the selection sits relative to the link.
    const parent = a.parentNode;
    const frag = document.createDocumentFragment();
    let lastNode = null;
    while (a.firstChild) {
      lastNode = a.firstChild;
      frag.appendChild(lastNode);
    }
    parent.replaceChild(frag, a);

    // Put the caret at the end of the unwrapped text so typing continues normally.
    if (lastNode) {
      const range = document.createRange();
      range.selectNodeContents(lastNode);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      savedSelection.current = range.cloneRange();
    }

    if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML);
    syncFormatState();
    syncActiveFormats();
  };

  // ── Image insert (content) ──────────────────────────────────────────────────
  const openTablePicker = () => {
    // Save caret before opening popup
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange();
    setTableRows(3); setTableCols(3); setShowTablePicker(true);
  };

  const insertTable = (rows, cols) => {
    setShowTablePicker(false);
    const r = Math.max(1, Number(rows) || 3);
    const cl = Math.max(1, Number(cols) || 3);
    const headerRow = Array(cl).fill('<th style="border:2px solid #1B1B1B;padding:10px 12px;background:#EAF7F0;font-weight:700">Header</th>').join("");
    const bodyRow   = Array(cl).fill('<td style="border:2px solid #1B1B1B;padding:10px 12px">Cell</td>').join("");
    const bodyRows  = r > 1 ? Array(r - 1).fill(`<tr>${bodyRow}</tr>`).join("") : "";
    const tableHtml = `<table style="border-collapse:collapse;width:100%;margin:1em 0"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table><p><br/></p>`;
    const sel = window.getSelection();
    if (savedSelection.current) { try { sel.removeAllRanges(); sel.addRange(savedSelection.current); } catch(_) {} }
    document.execCommand("insertHTML", false, tableHtml);
    if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML);
  };

  const insertFaq = () => {
    const faqHtml = '<dl><dt><strong>Question?</strong></dt><dd>Answer goes here.</dd></dl><p><br/></p>';
    const sel = window.getSelection();
    if (savedSelection.current) { try { sel.removeAllRanges(); sel.addRange(savedSelection.current); } catch(_) {} }
    document.execCommand("insertHTML", false, faqHtml);
    if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML);
  };

  // Insert a video embed into the article body. Remembers the caret, then on
  // confirm drops a non-editable placeholder figure that serializes to a
  // { type: "video" } block and renders as a real iframe on the live page.
  const openVideo = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange();
    setVideoPopover({ open: true, url: "" });
  };

  const insertVideoFromPopover = () => {
    const url = (videoPopover.url || "").trim();
    if (!getEmbedSrc(url)) return; // only accept recognised YouTube/Vimeo URLs
    const u = escapeHtml(url);
    const html =
      `<figure data-video-embed="${u}" contenteditable="false" ` +
      `style="position:relative;margin:1em auto;max-width:720px;aspect-ratio:16/9;` +
      `border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;background:#111;` +
      `display:flex;align-items:center;justify-content:center;color:#fff;` +
      `font:600 13px system-ui,sans-serif">&#9654; Video embed</figure><p><br/></p>`;
    const sel = window.getSelection();
    if (savedSelection.current) { try { sel.removeAllRanges(); sel.addRange(savedSelection.current); } catch(_) {} }
    document.execCommand("insertHTML", false, html);
    if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML);
    setVideoPopover({ open: false, url: "" });
  };

  const onImageClick = () => {
    // remember caret so the image lands where the user was typing
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedSelection.current = sel.getRangeAt(0).cloneRange();
    editingFigureRef.current = null; // new image, not editing existing
    fileInputRef.current?.click();
  };

  // Called when user clicks inside the editor body — detects image/figure clicks
  const onEditorClick = (e) => {
    const target = e.target;
    // Check if clicked element is an img or inside a figure
    const img = target.tagName === "IMG" ? target : target.closest("figure")?.querySelector("img");
    const figure = target.closest("figure") || (target.tagName === "IMG" ? target.parentElement : null);
    if (!img || !figure) return;

    // Highlight selected figure
    document.querySelectorAll(".wp-editor figure.selected-for-edit").forEach((el) => el.classList.remove("selected-for-edit"));
    figure.classList.add("selected-for-edit");

    // Extract all stored metadata from the figure/img
    const src = img.getAttribute("src") || "";
    if (!src) return;
    const alt = img.getAttribute("alt") || "";
    const title = img.getAttribute("title") || "";
    const width = img.getAttribute("data-width") || img.style.width?.replace("px", "") || "";
    const height = img.getAttribute("data-height") || img.style.height?.replace("px", "") || "";
    const alignment = figure.getAttribute("data-alignment") || "center";
    const videoUrl = figure.getAttribute("data-video-url") || "";
    const filename = figure.getAttribute("data-filename") || "";
    const fileFormat = figure.getAttribute("data-format") || "";
    const fileSize = figure.getAttribute("data-filesize") || "";
    const caption = figure.querySelector("figcaption")?.textContent?.trim() || "";

    // Detect natural dimensions
    const tmpImg = new window.Image();
    tmpImg.onload = () => {
      const naturalW = String(tmpImg.naturalWidth || "");
      const naturalH = String(tmpImg.naturalHeight || "");
      editingFigureRef.current = figure;
      setPendingImageUrl(src);
      setContentImageMeta({ alt, title, caption, description: "", videoUrl, width, height, alignment, filename, fileFormat, fileSize, naturalW, naturalH });
    };
    tmpImg.onerror = () => {
      editingFigureRef.current = figure;
      setPendingImageUrl(src);
      setContentImageMeta({ alt, title, caption, description: "", videoUrl, width, height, alignment, filename, fileFormat, fileSize, naturalW: "", naturalH: "" });
    };
    tmpImg.src = src;
  };

  const imageVideoMapRef = useRef({}); // maps imageUrl → youTubeUrl
  const editingFigureRef = useRef(null); // ref to the <figure> being re-edited

  const handleContentImage = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await compressAndUpload(file, { maxW: 1200, quality: 0.8 });
      addToMediaLib({ url, type: "content", name: file.name, addedAt: Date.now(), size: file.size });
      // Detect natural dimensions
      const dims = await new Promise((resolve) => {
        const tmp = new window.Image();
        tmp.onload = () => resolve({ w: tmp.naturalWidth, h: tmp.naturalHeight });
        tmp.onerror = () => resolve({ w: "", h: "" });
        tmp.src = url;
      });
      const kb = file.size ? (file.size / 1024).toFixed(1) + " KB" : "";
      const fmt = (file.type || "").replace("image/", "").toUpperCase() || file.name.split(".").pop().toUpperCase();
      setPendingImageUrl(url);
      setContentImageMeta({
        alt: "", title: "", caption: "", description: "", videoUrl: "",
        width: String(dims.w || ""), height: String(dims.h || ""),
        alignment: "center", sizePreset: "large",
        filename: file.name,
        fileFormat: fmt,
        fileSize: kb,
        naturalW: String(dims.w || ""),
        naturalH: String(dims.h || ""),
      });
    } catch (e) { alert("Image upload failed: " + e.message); }
    finally { setImageUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const insertContentImage = () => {
    if (!pendingImageUrl) return;
    const { alt, title, caption, videoUrl, width, height, alignment } = contentImageMeta;
    const ytId = getYouTubeId(videoUrl);
    if (ytId) imageVideoMapRef.current[pendingImageUrl] = videoUrl;

    // Build the figure element directly in the DOM — more reliable than execCommand
    const figure = document.createElement("figure");
    if (videoUrl) figure.setAttribute("data-video-url", videoUrl);
    if (alignment) figure.setAttribute("data-alignment", alignment);
    // Apply alignment style to figure
    const alignStyle = alignment === "left" ? "margin-right:auto;margin-left:0;" : alignment === "right" ? "margin-left:auto;margin-right:0;" : "margin-left:auto;margin-right:auto;";
    const figWidth = width ? `max-width:${width}px;` : "";
    figure.style.cssText = `${alignStyle}${figWidth}`;
    const img = document.createElement("img");
    img.src = pendingImageUrl;
    img.alt = alt || "";
    if (title) img.title = title;
    if (width) img.setAttribute("data-width", width);
    if (height) img.setAttribute("data-height", height);
    const { filename, fileFormat, fileSize } = contentImageMeta;
    if (filename) figure.setAttribute("data-filename", filename);
    if (fileFormat) figure.setAttribute("data-format", fileFormat);
    if (fileSize) figure.setAttribute("data-filesize", fileSize);
    // Apply inline dimensions
    if (width) img.style.width = width + "px";
    if (height) img.style.height = height + "px";
    if (width || height) img.style.objectFit = "cover";
    figure.appendChild(img);
    if (caption) {
      const figcap = document.createElement("figcaption");
      figcap.textContent = caption;
      figure.appendChild(figcap);
    }
    const spacer = document.createElement("p");
    spacer.innerHTML = "<br/>";

    const body = bodyRef.current;
    if (!body) return;

    // If editing an existing figure — replace it in-place
    if (editingFigureRef.current && editingFigureRef.current.parentNode) {
      editingFigureRef.current.parentNode.replaceChild(figure, editingFigureRef.current);
      editingFigureRef.current = null;
      figure.classList.remove("selected-for-edit");
    } else {
      // Try to insert at saved caret position; fallback to appending at end
      const sel = window.getSelection();
      let inserted = false;
      if (savedSelection.current) {
        try {
          body.focus();
          sel.removeAllRanges();
          sel.addRange(savedSelection.current);
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(spacer);
          range.insertNode(figure);
          const newRange = document.createRange();
          newRange.setStartAfter(spacer);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          inserted = true;
        } catch (_) {}
      }
      if (!inserted) {
        body.appendChild(figure);
        body.appendChild(spacer);
      }
    }

    setPendingImageUrl(null);
    setContentImageMeta({ alt: "", title: "", caption: "", description: "", videoUrl: "", width: "", height: "", alignment: "center", sizePreset: "large", filename: "", fileFormat: "", fileSize: "", naturalW: "", naturalH: "" });
    // Snapshot immediately — direct DOM read is synchronous
    if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML);
  };

  const cancelContentImage = () => {
    editingFigureRef.current = null;
    // Remove any highlight
    document.querySelectorAll(".wp-editor figure.selected-for-edit").forEach((el) => el.classList.remove("selected-for-edit"));
    setPendingImageUrl(null);
    setContentImageMeta({ alt: "", title: "", caption: "", description: "", videoUrl: "", width: "", height: "", alignment: "center", sizePreset: "large", filename: "", fileFormat: "", fileSize: "", naturalW: "", naturalH: "" });
  };

  const handleHeroImage = async (file) => {
    if (!file) return;
    // instant local thumbnail while the upload runs
    let localPreview = "";
    try { localPreview = URL.createObjectURL(file); setHeroPreview(localPreview); } catch (_) {}
    setHeroUploading(true);
    try {
      const url = await compressAndUpload(file, { maxW: 1400, quality: 0.82 });
      setMeta((p) => ({ ...p, heroImage: url }));
      // Keep the Blog schema's image in sync with the featured image
      setSchemas((p) => (p.blog?.enabled ? { ...p, blog: { ...p.blog, data: { ...p.blog.data, image: url } } } : p));
      addToMediaLib({ url, type: "featured", name: file.name, addedAt: Date.now(), size: file.size });
    } catch (e) { alert("Featured image upload failed: " + e.message); }
    finally {
      setHeroUploading(false);
      setHeroPreview("");
      if (localPreview) { try { URL.revokeObjectURL(localPreview); } catch (_) {} }
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  // ── Export / publish ──────────────────────────────────────────────────────
  const exportBlogData = () => {
    const html = bodyRef.current ? bodyRef.current.innerHTML : initialHtml.current;
    const rawSections = htmlToSections(html);
    // Attach stored YouTube URLs to image sections before publishing
    const sections = rawSections.map((s) =>
      s.type === "image" && s.src && imageVideoMapRef.current[s.src]
        ? { ...s, videoUrl: imageVideoMapRef.current[s.src] }
        : s
    );
    const title = meta.title;
    const slug  = meta.slug || slugify(title) || `blog-${Date.now()}`;
    const tagsArr = meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    return {
      id:          isEditMode ? editingBlogId.current : Date.now(),
      slug, category: meta.category,
      title: meta.metaTitle || meta.title, headline: meta.title,
      description: meta.description, date: meta.date,
      keywords: meta.keywords, author: meta.author,
      image: meta.heroImage, heroImage: meta.heroImage, coverImage: meta.heroImage,
      imageAlt: meta.imageAlt || title,
      imageTitle: meta.imageTitle,
      imageCaption: meta.imageCaption,
      imageDescription: meta.imageDescription,
      videoUrl: meta.videoUrl,
      tags: tagsArr, sections,
      schemas,
    };
  };

  const downloadExcel = () => { const d=exportBlogData(); const rows=[["Field","Value"]]; const flat=(obj,pre="")=>Object.entries(obj).forEach(([k,v])=>{const key=pre?`${pre}.${k}`:k;if(v&&typeof v==="object"&&!Array.isArray(v))flat(v,key);else rows.push([key,Array.isArray(v)?v.join(", "):String(v??"")])}); flat(d); const csv=rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n"); const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`blog-${d.slug||"export"}.csv`}); a.click(); URL.revokeObjectURL(a.href); };

  // ── GitHub publish ──────────────────────────────────────────────────────────
  // GitHub access (token, repo, branch, file, fetch) lives in lib/githubBlogs.js — one source for the list and for publishing.
  const fetchCurrentFile = fetchBlogsFile;

  // "Fix" links in the publish checklist: scroll to the field and focus it.
  const jumpToField = (id) => {
    if (id === "cms-slug") { setSlugEditing(true); }
    setShowSettings(true);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.matches("input,textarea,button,[contenteditable]") ? el : el.querySelector("input,textarea,button");
      try { (focusable || el).focus({ preventScroll: true }); } catch (_) {}
    }, 60);
  };
  const bodyWordCount = (bodySnapshot || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").split(/\s+/).filter(Boolean).length;

  // Leaving with work in progress: ask first (the old "Move to Trash" only left the page, without saving).
  const discardAndLeave = () => {
    const hasWork = !!(meta.title || bodyWordCount);
    if (hasWork && !window.confirm("Leave without publishing? Changes that haven't been published or saved as a draft will be lost.")) return;
    onBack();
  };

  const [hasPreviewedBlog, setHasPreviewedBlog] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const previewBlog = () => {
    const html = bodyRef.current ? bodyRef.current.innerHTML : "";
    setHasPreviewedBlog(true);
    const w = window.open("", "_blank");
    if (!w) { alert("Allow popups to preview."); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview: ${meta.title || "Untitled"}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Montserrat,-apple-system,sans-serif;color:#1a1a1a;line-height:1.7;background:#fff}
    .bar{position:sticky;top:0;z-index:99;background:#111;color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-size:13px}
    .bar button{background:#E6AC00;color:#111;border:none;padding:8px 20px;border-radius:8px;font-weight:700;cursor:pointer}
    .hero{background:linear-gradient(135deg,#1a1a1a,#333);color:#fff;padding:60px 24px 50px;text-align:center}
    .hero h1{font-size:clamp(26px,4vw,42px);font-weight:800;max-width:700px;margin:0 auto}
    .hero .meta{font-size:13px;color:rgba(255,255,255,0.6);margin-top:12px}
    .hero img{max-width:700px;width:100%;border-radius:16px;margin-top:24px;object-fit:cover;max-height:400px}
    article{max-width:700px;margin:0 auto;padding:32px 24px 60px;font-size:16px}
    article h2{font-size:24px;font-weight:700;margin:32px 0 12px}article h3{font-size:20px;font-weight:600;margin:24px 0 10px}
    article p{margin:0 0 14px}article ul,article ol{margin:0 0 14px;padding-left:20px}article li{margin:0 0 6px}
    article img{max-width:100%;border-radius:12px;margin:16px 0}article a{color:#E6AC00;text-decoration:underline}
    article table{width:100%;border-collapse:collapse;margin:16px 0}article th,article td{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:14px}article th{background:#f9fafb;font-weight:600}
    </style></head><body>
    <div class="bar"><span>PREVIEW — not published yet</span><button onclick="window.close()">Close</button></div>
    <div class="hero"><h1>${meta.title || "Untitled"}</h1>
    <div class="meta">${meta.category || ""} · ${meta.date || new Date().toLocaleDateString()}</div>
    ${meta.heroImage ? '<img src="' + meta.heroImage + '" />' : ""}</div>
    <article>${html}</article></body></html>`);
    w.document.close();
  };

  const requestPublish = () => {
    if (!meta.title) { alert("Add a title before publishing."); return; }
    const html = bodyRef.current ? bodyRef.current.innerHTML : "";
    if (!htmlToSections(html).length) { alert("Add some content before publishing."); return; }
    if (!hasPreviewedBlog) { alert("Please preview the blog before publishing. Click the Preview button first."); return; }
    setShowPublishConfirm(true);
  };

  const publishBlog = async () => {
    setShowPublishConfirm(false);
    if (!meta.title) { alert("Add a title before publishing."); return; }
    const html = bodyRef.current ? bodyRef.current.innerHTML : "";
    if (!htmlToSections(html).length) { alert("Add some content before publishing."); return; }

    // Prevent double-publish if button clicked multiple times
    if (publishStatus === "loading") return;

    setPublishStatus("loading");
    setPublishMsg("Fetching latest blogs.js…");
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        setPublishMsg(`Fetching latest version… (${attempt}/${MAX_RETRIES})`);
        const { sha, blogsArray } = await fetchCurrentFile();
        const blogData = exportBlogData();
        let newBlogsArray;

        if (isEditMode) {
          setPublishMsg("Updating existing post…");
          const idx = blogsArray.findIndex((b) =>
            String(b.id) === String(editingBlogId.current) || b.slug === editingBlogOriginalSlug.current);
          if (idx === -1) throw new Error(`Could not find the original post in blogs.js (id "${editingBlogId.current}").`);
          newBlogsArray = [...blogsArray];
          newBlogsArray[idx] = { ...blogData, id: blogsArray[idx].id };
        } else {
          setPublishMsg("Adding new post…");
          // Guard: remove any existing entry with the same slug to prevent duplicates on retry
          const filtered = blogsArray.filter((b) => b.slug !== blogData.slug);
          const nextId = Math.max(0, ...filtered.map((b) => Number(b.id) || 0)) + 1;
          newBlogsArray = [{ ...blogData, id: nextId }, ...filtered];
        }

        const entriesStr = newBlogsArray.map((b) => "  " + JSON.stringify(b, null, 2).replace(/\n/g, "\n  ")).join(",\n");
        const newContent = `export const BLOGS = [\n${entriesStr}\n];\n`;

        setPublishMsg("Committing to GitHub…");
        const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
          method: "PUT",
          headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
          body: JSON.stringify({
            message: isEditMode ? `update blog: ${blogData.slug}` : `add blog: ${blogData.slug}`,
            content: btoa(unescape(encodeURIComponent(newContent))), sha, branch: GH_BRANCH,
          }),
        });

        if (putRes.status === 409) {
          if (attempt < MAX_RETRIES) { setPublishMsg(`Sync conflict — retrying… (${attempt}/${MAX_RETRIES})`); await new Promise((r) => setTimeout(r, 800 * attempt)); continue; }
          throw new Error("Sync conflict: GitHub rejected the update 3 times. Please try again.");
        }
        if (!putRes.ok) { const err = await putRes.json().catch(() => ({})); throw new Error(err.message || `Commit failed: HTTP ${putRes.status}`); }

        if (isEditMode) editingBlogOriginalSlug.current = blogData.slug;
        resetCmsBlogsCache(); // next visit to the list reloads from GitHub
        refreshLiveBlogs();   // immediately refresh the live blog cache so the post appears on the public site
        setPublishStatus("success");
        setPublishMsg(isEditMode ? "Updated! Live on the site now." : "Published! Live on the site now.");
        return;
      } catch (e) {
        if (attempt === MAX_RETRIES || !e.message?.includes("Sync conflict")) {
          setPublishStatus("error"); setPublishMsg(e.message || "Something went wrong."); return;
        }
      }
    }
  };

  // ── Drafts ──────────────────────────────────────────────────────────────────
  const loadDrafts = () => {
    if (typeof localStorage === "undefined") return;
    setDrafts(Object.keys(localStorage).filter((k) => k.startsWith("draft_")).map((key) => ({ key, data: JSON.parse(localStorage.getItem(key)) })));
  };
  const saveDraft = () => {
    const key = currentDraftKey || `draft_${Date.now()}`;
    const body = bodyRef.current ? bodyRef.current.innerHTML : "";
    localStorage.setItem(key, JSON.stringify({ meta, body, schemas, savedAt: new Date().toISOString() }));
    setCurrentDraftKey(key); loadDrafts();
    setPublishStatus("success"); setPublishMsg("Draft saved.");
  };
  const loadDraft = (key) => {
    const d = JSON.parse(localStorage.getItem(key));
    setMeta(d.meta);
    setSchemas(normalizeSchemas(d.schemas));
    if (bodyRef.current) bodyRef.current.innerHTML = d.body || "";
    setCurrentDraftKey(key); setShowDrafts(false);
    setPublishStatus("success"); setPublishMsg("Draft loaded.");
  };
  const deleteDraft = (key) => { localStorage.removeItem(key); loadDrafts(); };

  // ── Auto-draft recovery on mount (blog editor) ──
  useEffect(() => {
    if (typeof localStorage === "undefined" || editingBlog) return;
    const autoKey = "draft_autosave_blog";
    const raw = localStorage.getItem(autoKey);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d?.meta?.title || d?.body) {
        const ago = d.savedAt ? new Date(d.savedAt).toLocaleString() : "";
        if (window.confirm(`Recover unsaved blog draft${d.meta?.title ? ` "${d.meta.title}"` : ""}${ago ? ` from ${ago}` : ""}?`)) {
          setMeta(d.meta);
          setSchemas(normalizeSchemas(d.schemas));
          if (bodyRef.current) bodyRef.current.innerHTML = d.body || "";
          setCurrentDraftKey(autoKey);
          setPublishStatus("success"); setPublishMsg("Draft recovered.");
        }
      }
    } catch {}
  }, []);

  // ── Schema config helpers ─────────────────────────────────────────────────
  // Extract FAQ Q&A pairs from the editor. Supports two authoring styles:
  //   • <dl><dt>question</dt><dd>answer</dd></dl>  (FAQ toolbar block)
  //   • <ol><li>Question? Answer text</li></ol>    (ordered-list FAQ)
  const extractFaqFromBody = () => {
    if (!bodyRef.current) return [];
    const items = [];
    bodyRef.current.querySelectorAll("dl").forEach((dl) => {
      let cur = null;
      dl.childNodes.forEach((ch) => {
        const tag = ch.tagName?.toLowerCase();
        if (tag === "dt") { cur = { name: ch.textContent.trim(), text: "" }; items.push(cur); }
        else if (tag === "dd" && cur) { cur.text = ch.textContent.trim(); }
      });
    });
    // Ordered lists whose items are "Question? Answer" pairs
    bodyRef.current.querySelectorAll("ol").forEach((ol) => {
      const lis = Array.from(ol.querySelectorAll(":scope > li")).map((li) => li.textContent.trim()).filter(Boolean);
      const isFaqStyle = lis.length > 0 && lis.every((t) => { const qi = t.indexOf("?"); return qi > 0 && qi < t.length - 1; });
      if (isFaqStyle) {
        lis.forEach((t) => { const qi = t.indexOf("?"); items.push({ name: t.slice(0, qi + 1).trim(), text: t.slice(qi + 1).trim() }); });
      }
    });
    return items;
  };

  const setSchemaCfg = (id, patch) => {
    // When enabling FAQ schema, auto-populate items from editor FAQ blocks
    if (id === "faq" && patch.enabled === true) {
      const faqItems = extractFaqFromBody();
      if (faqItems.length > 0) {
        setSchemas((p) => ({
          ...p,
          [id]: { ...p[id], ...patch, data: { ...p[id].data, items: faqItems } },
        }));
        return;
      }
    }
    // When enabling Blog schema, auto-connect its fields to this post
    // (headline, page URL, image, and dates) so the schema matches the content.
    if (id === "blog" && patch.enabled === true) {
      const SITE = SITE_ORIGIN;
      const slug = meta.slug || slugify(meta.title || "");
      const iso = meta.date && !Number.isNaN(Date.parse(meta.date))
        ? new Date(meta.date).toISOString() : "";
      setSchemas((p) => {
        const prev = p[id].data || {};
        return {
          ...p,
          [id]: {
            ...p[id], ...patch,
            data: {
              ...prev,
              headline: meta.title || prev.headline || "",
              image: meta.heroImage || prev.image || "",
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": slug ? `${SITE}/blogs/${slug}` : (prev.mainEntityOfPage?.["@id"] || ""),
              },
              ...(iso ? { datePublished: iso, dateModified: iso } : {}),
            },
          },
        };
      });
      return;
    }
    setSchemas((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  };
  const setSchemaField = (id, key, val) =>
    setSchemas((p) => ({ ...p, [id]: { ...p[id], data: { ...p[id].data, [key]: val } } }));
  const setSchemaItem  = (id, idx, key, val) =>
    setSchemas((p) => {
      const items = [...(p[id].data.items || [])];
      items[idx] = { ...items[idx], [key]: val };
      return { ...p, [id]: { ...p[id], data: { ...p[id].data, items } } };
    });
  const addSchemaItem = (id, def) =>
    setSchemas((p) => ({ ...p, [id]: { ...p[id], data: { ...p[id].data, items: [...(p[id].data.items || []), def.newItem()] } } }));
  const removeSchemaItem = (id, idx) =>
    setSchemas((p) => ({ ...p, [id]: { ...p[id], data: { ...p[id].data, items: (p[id].data.items || []).filter((_, k) => k !== idx) } } }));

  // Save a pasted (Upload) schema: parse it, fill the Default fields with its
  // values, and switch to Default mode so the blogger can edit field-by-field.
  const [schemaSavedId, setSchemaSavedId] = useState(null);
  const saveUploadedSchema = (def) => {
    const cfg = schemas[def.id];
    const parsed = parseJsonLd(cfg.json);
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!obj) return; // invalid JSON — the ⚠ indicator already shows
    const data = extractToData(def.id, obj);
    if (!data) return;
    setSchemaCfg(def.id, { data, mode: "default" });
    setSchemaSavedId(def.id);
    setTimeout(() => setSchemaSavedId((cur) => (cur === def.id ? null : cur)), 2500);
  };

  // Combined JSON-LD preview of every enabled schema
  const jsonLdPreview = useMemo(() => schemaGraphToString(schemas), [schemas]);
  const enabledSchemaCount = useMemo(
    () => Object.values(schemas).filter((s) => s.enabled).length, [schemas]);

  // Flatten an object schema's data into editable leaf rows {path,value} and
  // write a value back by its dot path (so every key shows and stays editable).
  const flattenLeaves = (obj, prefix = "") => {
    let rows = [];
    Object.entries(obj || {}).forEach(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        rows = rows.concat(flattenLeaves(v, path));
      } else if (Array.isArray(v)) {
        rows.push({ path, value: JSON.stringify(v) });
      } else {
        rows.push({ path, value: v == null ? "" : String(v) });
      }
    });
    return rows;
  };
  const setSchemaPath = (id, path, value) =>
    setSchemas((p) => {
      const keys = path.split(".");
      const root = { ...(p[id].data || {}) };
      let cur = root;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = (cur[keys[i]] && typeof cur[keys[i]] === "object") ? { ...cur[keys[i]] } : {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return { ...p, [id]: { ...p[id], data: root } };
    });
  const pathLabel = (path) => {
    const parts = path.split(".");
    return { key: parts[parts.length - 1], parent: parts.slice(0, -1).join(" › ") };
  };

  // ── Preview sections ──────────────────────────────────────────────────────
  // Always keep sections computed — preview reads them the moment it opens
  const computeSections = useCallback(() => {
    const html = bodyRef.current?.innerHTML || bodySnapshot;
    const sections = htmlToSections(html);
    return sections.map((s) => {
      if (s.type === "image" && s.src) {
        const storedVideo = imageVideoMapRef.current[s.src];
        return storedVideo ? { ...s, videoUrl: storedVideo } : s;
      }
      return s;
    });
  }, [bodySnapshot]);

  // Live preview pane: the same sections the public page renders, deferred so typing stays smooth.
  const deferredSnap = useDeferredValue(bodySnapshot);
  const liveSections = useMemo(() => computeSections(), [computeSections, deferredSnap]);
  const ready = buildChecklist(meta, bodyWordCount);
  const readyDone = ready.filter((i) => i.status === "ok").length;
  const [toolsOpen, setToolsOpen] = useState(false);

  const previewSections = useMemo(() => {
    if (!previewMode) return [];
    return computeSections();
  }, [previewMode, computeSections, bodySnapshot]);

  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "home_blank", label: "Home",  Icon: Home,      onClick: () => setActiveNav("home_blank") },
    { id: "home",       label: "Blogs", Icon: FileText,  onClick: onBack },
    { id: "media",      label: "Media", Icon: MediaIcon, onClick: () => setActiveNav("media") },
    ...(canManageRedirects ? [{ id: "redirects", label: "Redirects", Icon: ArrowRight, onClick: () => setActiveNav("redirects") }] : []),
    ...(isAdmin ? [{ id: "users", label: "Users", Icon: UsersIcon, onClick: () => setActiveNav("users") }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Urbanist', sans-serif", background: "#F9FAFB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        
        /* ══════ FONTS ══════ */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        .nv-root, .nv-root * { font-family:'Inter','Urbanist',system-ui,sans-serif; }
        
        /* ══════ ANIMATIONS ══════ */
        @keyframes cms-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cms-slide-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cms-glow { 0%,100% { box-shadow:0 0 20px rgba(245,166,35,0.15); } 50% { box-shadow:0 0 30px rgba(245,166,35,0.25); } }
        @keyframes cms-shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes cms-dot-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        
        /* ══════ EDITOR CONTENT ══════ */
        .wp-editor a { color:#F5A623; text-decoration:underline; text-underline-offset:3px; text-decoration-thickness:1.5px; }
        .wp-editor a:hover { color:#D97706; }
        .wp-editor h1 { font-size:30px; font-weight:900; margin:.8em 0 .4em; color:#0a0a0a; letter-spacing:-0.03em; line-height:1.2; }
        .wp-editor h2 { font-size:24px; font-weight:800; margin:.7em 0 .35em; color:#0a0a0a; letter-spacing:-0.02em; line-height:1.25; }
        .wp-editor h3 { font-size:20px; font-weight:700; margin:.6em 0 .3em; color:#111827; letter-spacing:-0.01em; }
        .wp-editor h4 { font-size:17px; font-weight:700; margin:.6em 0 .3em; color:#111827; }
        .wp-editor h5 { font-size:15px; font-weight:700; margin:.5em 0 .25em; color:#374151; }
        .wp-editor h6 { font-size:13px; font-weight:700; margin:.5em 0 .25em; color:#374151; text-transform:uppercase; letter-spacing:0.05em; }
        .wp-editor p { margin:0 0 1em; line-height:1.85; color:#374151; font-size:15.5px; }
        .wp-editor ul { list-style:none; padding-left:0; margin:0 0 1em; }
        .wp-editor ul li { position:relative; padding-left:1.5em; margin:.35em 0; line-height:1.75; color:#374151; }
        .wp-editor ul li:before { content:""; position:absolute; left:0; top:0.65em; width:6px; height:6px; border-radius:50%; background:#F5A623; }
        .wp-editor ol { list-style:decimal; padding-left:1.6em; margin:0 0 1em; }
        .wp-editor ol li { margin:.35em 0; line-height:1.75; color:#374151; }
        .wp-editor blockquote { border-left:4px solid #F5A623; background:linear-gradient(135deg,#FFFBEB,#FEF3C7); padding:16px 20px; margin:0 0 1.2em; font-style:italic; color:#92400E; border-radius:0 16px 16px 0; font-size:15.5px; line-height:1.7; }
        .wp-editor figure { margin:0 0 1.2em; border-radius:16px; overflow:hidden; }
        .wp-editor figure img { max-width:100%; height:auto; display:block; transition:transform .3s; }
        .wp-editor figure:hover img { transform:scale(1.01); }
        .wp-editor figure { cursor:pointer; transition:all 0.25s; border:2px solid transparent; }
        .wp-editor figure:hover { border-color:rgba(245,166,35,0.3); box-shadow:0 4px 20px rgba(245,166,35,0.1); }
        .wp-editor figure.selected-for-edit { border-color:#F5A623; box-shadow:0 0 0 4px rgba(245,166,35,0.15); }
        .wp-editor figcaption { font-size:12.5px; color:#9CA3AF; padding:10px 4px 2px; font-style:italic; text-align:center; }
        .wp-editor table { border-collapse:separate; border-spacing:0; width:100%; margin:0 0 1.2em; border:1.5px solid #E5E7EB; border-radius:14px; overflow:hidden; }
        .wp-editor th { padding:13px 16px; text-align:left; font-weight:700; background:linear-gradient(180deg,#F9FAFB,#F3F4F6); color:#111827; font-size:13px; text-transform:uppercase; letter-spacing:0.03em; border-bottom:1.5px solid #E5E7EB; }
        .wp-editor td { padding:12px 16px; text-align:left; color:#374151; font-size:14px; border-bottom:1px solid #F3F4F6; }
        .wp-editor tr:last-child td { border-bottom:none; }
        .wp-editor:empty:before { content:attr(data-placeholder); color:#D1D5DB; font-size:16px; font-weight:500; }
        .wp-editor:focus { outline:none; }

        /* ══════ INPUTS ══════ */
        .wp-input { width:100%; padding:11px 16px; font-size:14px; border-radius:12px; border:1.5px solid #E5E7EB; outline:none; transition:all .25s cubic-bezier(.4,0,.2,1); background:#fff; font-family:inherit; color:#111827; }
        .wp-input:hover { border-color:#D1D5DB; }
        .wp-input:focus { border-color:#F5A623; background:#fff; box-shadow:0 0 0 4px rgba(245,166,35,0.1), 0 1px 3px rgba(0,0,0,0.05); }
        .wp-input::placeholder { color:#C4C8CC; font-weight:500; }
        textarea.wp-input { line-height:1.7; }
        input[type="file"] { font-size:12px; color:#6B7280; border:2px dashed #D1D5DB; border-radius:14px; padding:12px 16px; width:100%; background:linear-gradient(135deg,#FAFAFA,#F3F4F6); cursor:pointer; transition:all .25s; font-weight:500; }
        input[type="file"]:hover { border-color:#F5A623; background:linear-gradient(135deg,#FFFBEB,#FEF9EE); }

        /* ══════ BUTTONS ══════ */
        .wp-primary { padding:11px 24px; border-radius:14px; color:#fff; font-weight:700; font-size:13.5px; border:none; cursor:pointer; transition:all .25s cubic-bezier(.4,0,.2,1); background:linear-gradient(135deg,#F5A623 0%,#E09000 50%,#D97706 100%); box-shadow:0 2px 12px rgba(245,166,35,0.3), inset 0 1px 0 rgba(255,255,255,0.15); letter-spacing:0.01em; position:relative; overflow:hidden; }
        .wp-primary:before { content:""; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.1),transparent); transition:opacity .2s; }
        .wp-primary:hover:not(:disabled) { box-shadow:0 6px 24px rgba(245,166,35,0.4), inset 0 1px 0 rgba(255,255,255,0.2); transform:translateY(-2px); }
        .wp-primary:active:not(:disabled) { transform:translateY(0); box-shadow:0 2px 8px rgba(245,166,35,0.3); }
        .wp-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; filter:grayscale(0.3); }
        .wp-secondary { background:#fff; color:#374151; border:1.5px solid #E5E7EB; padding:9px 18px; border-radius:12px; font-weight:600; font-size:13px; cursor:pointer; transition:all .2s; }
        .wp-secondary:hover { background:#F9FAFB; border-color:#D1D5DB; color:#111827; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .wp-button-primary { background:linear-gradient(135deg,#F5A623,#E09000); color:#fff; border:none; padding:9px 20px; border-radius:12px; font-weight:700; font-size:12.5px; cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(245,166,35,0.25); }
        .wp-button-primary:hover:not(:disabled) { box-shadow:0 4px 16px rgba(245,166,35,0.35); transform:translateY(-1px); }
        .wp-link { color:#F5A623; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; text-decoration:none; }
        .wp-link:hover { color:#D97706; text-decoration:underline; text-underline-offset:2px; }

        /* ══════ TOOLBAR ══════ */
        .nv-toolbtn { height:38px; min-width:38px; padding:0 9px; display:flex; align-items:center; justify-content:center; border-radius:10px; color:#9CA3AF; border:none; background:transparent; transition:all .2s cubic-bezier(.4,0,.2,1); cursor:pointer; position:relative; }
        .nv-toolbtn:hover { background:#F3F4F6; color:#374151; transform:translateY(-1px); }
        .nv-toolbtn.active { background:linear-gradient(135deg,#F5A623,#E09000); color:#fff; box-shadow:0 3px 12px rgba(245,166,35,0.35); transform:translateY(-1px); }
        .nv-toolbtn:active { transform:translateY(0) scale(0.95); }

        /* ══════ META BOXES ══════ */
        .meta-box { background:#fff; border:1px solid #E5E7EB; border-radius:18px; margin-bottom:16px; overflow:hidden; transition:all .25s cubic-bezier(.4,0,.2,1); animation:cms-slide-up 0.35s ease-out both; }
        .meta-box:hover { box-shadow:0 4px 20px rgba(0,0,0,0.06); border-color:#D1D5DB; }
        .meta-box-head { display:flex; align-items:center; justify-content:space-between; padding:15px 20px; border-bottom:1px solid #F3F4F6; background:linear-gradient(180deg,#FAFAFA,#F9FAFB); }
        .meta-box-title { font-size:14px; font-weight:800; color:#111827; letter-spacing:-0.01em; }
        .meta-box:nth-child(1) { animation-delay: 0s; }
        .meta-box:nth-child(2) { animation-delay: 0.05s; }
        .meta-box:nth-child(3) { animation-delay: 0.1s; }
        .meta-box:nth-child(4) { animation-delay: 0.15s; }

        /* ══════ SCROLLBARS ══════ */
        .row-scroll::-webkit-scrollbar { width:5px; }
        .row-scroll::-webkit-scrollbar-track { background:transparent; }
        .row-scroll::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:4px; }
        .row-scroll::-webkit-scrollbar-thumb:hover { background:#D1D5DB; }
        .nv-sidebar-right::-webkit-scrollbar { width:4px; }
        .nv-sidebar-right::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }

        /* ══════ SELECTION ══════ */
        .wp-editor ::selection { background:rgba(245,166,35,0.2); }
        .nv-root ::selection { background:rgba(245,166,35,0.15); }

        /* ══════ LABELS ══════ */
        .nv-root label > span:first-child { font-size:12px; font-weight:700; color:#374151; letter-spacing:0.02em; }

        /* ══════ EDITOR FONT ══════ */
        .wp-editor, .wp-editor * { font-family:'Inter','Urbanist',system-ui,sans-serif !important; }
        
        /* ══════ TOOLTIPS ══════ */
        [title] { position: relative; }
        
        /* ══════ SMOOTH PAGE TRANSITIONS ══════ */
        @keyframes cms-page-enter { from { opacity:0; transform:scale(0.98) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        
        /* ══════ FOCUS VISIBLE ══════ */
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #F5A623; outline-offset: 2px; border-radius: 8px; }
        
        /* ══════ REDUCED MOTION ══════ */
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* ── PREVIEW OVERLAY ───────────────────────────────────────────── */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto nv-root">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3" style={{ background: "linear-gradient(90deg,#18181B,#09090B)" }}>
            <div className="flex items-center gap-3 text-white">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#F5A623" }} />
              <span className="font-bold text-sm">Preview — how this post will look</span>
            </div>
            <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-1.5 rounded-lg hover:bg-white/25 text-xs font-semibold">
              <EyeOff size={13} /> Back to editor
            </button>
          </div>
          {/* Schema JSON-LD injected into preview */}
          {jsonLdPreview && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdPreview }} />
          )}
          {/* Schema visual badge in preview */}
          {schemas && Object.values(schemas).some((s) => s.enabled) && (
            <div className="max-w-3xl mx-auto px-6 pt-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(schemas).filter(([,s]) => s.enabled).map(([id]) => (
                  <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#059669]/20">
                    ✓ Schema: {id}
                  </span>
                ))}
              </div>
            </div>
          )}
          <article className="max-w-3xl mx-auto px-6 py-10">
            <span className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "#ECFDF5", color: "#059669" }}>{meta.category}</span>
            <h1 className="mt-3 text-[26px] sm:text-[34px] font-bold text-[#111827] leading-tight">{meta.title || "Untitled post"}</h1>
            <div className="mt-2 text-[13px] text-slate-500 flex items-center gap-3"><span>{meta.author}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>{meta.date}</span></div>
            {meta.heroImage && (
              <figure className="mt-5">
                <div className="relative rounded-2xl overflow-hidden border border-slate-100 group">
                  <img src={meta.heroImage} alt={meta.imageAlt} title={meta.imageTitle || undefined} className="w-full object-cover" />
                </div>
                {meta.imageCaption && <figcaption className="mt-2 text-[13px] text-slate-500 text-center">{meta.imageCaption}</figcaption>}
              </figure>
            )}
            <div className="mt-7 space-y-5">
              {(() => {
                const used = new Map();
                return previewSections.map((s, i) => (
                  <PreviewSection key={i} s={s} usedH3={used} onPlayVideo={(url) => setImageVideoPopup({ videoUrl: url })} />
                ));
              })()}
            </div>
          </article>
        </div>
      )}

      {/* ── TABLE PICKER POPUP ── */}
      {showTablePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowTablePicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-extrabold text-[#111827] flex items-center gap-2">
              <Table size={16} className="text-[#1B1B1B]" /> Insert Table
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Rows</label>
                <input type="number" min="1" max="20" value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] text-center font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Columns</label>
                <input type="number" min="1" max="10" value={tableCols}
                  onChange={(e) => setTableCols(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] text-center font-bold" />
              </div>
            </div>
            {/* Visual grid preview */}
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: Math.min(Number(tableRows) || 1, 6) }).map((_, ri) => (
                <div key={ri} className="flex gap-0.5">
                  {Array.from({ length: Math.min(Number(tableCols) || 1, 6) }).map((_, ci) => (
                    <div key={ci} className="flex-1 h-5 rounded-sm" style={{ background: ri === 0 ? "#1B1B1B" : "#ECFDF5", border: "1px solid #1B1B1B33" }} />
                  ))}
                </div>
              ))}
              {(Number(tableRows) > 6 || Number(tableCols) > 6) && (
                <p className="text-[10px] text-[#9CA3AF] text-center mt-1">Preview shows up to 6×6</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => insertTable(tableRows, tableCols)}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2"
                style={{ background: "#1B1B1B" }}>
                <Table size={14} /> Insert {tableRows}×{tableCols} table
              </button>
              <button onClick={() => setShowTablePicker(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-[#6B7280] font-semibold text-[13px] hover:bg-[#F9FAFB]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT IMAGE VIDEO LIGHTBOX ──────────────────────────── */}
      {imageVideoPopup && (() => {
        const vid = getYouTubeId(imageVideoPopup.videoUrl);
        return (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setImageVideoPopup(null)}
          >
            <div
              className="relative w-full max-w-3xl mx-4"
              style={{ aspectRatio: "16/9" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setImageVideoPopup(null)}
                className="absolute -top-9 right-0 text-white text-sm font-semibold flex items-center gap-1.5 hover:text-[#F5A623] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Close
              </button>
              {vid ? (
                <iframe
                  src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="w-full h-full rounded-xl border-0"
                  title="YouTube video"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-[#111827] flex items-center justify-center text-white text-sm">
                  Invalid YouTube URL — cannot preview.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="flex h-screen overflow-hidden nv-root">
        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* top bar */}
          <div className="h-14 shrink-0 bg-white border-b border-[#E5E7EB] flex items-center gap-2.5 px-4 relative z-30">
            <button onClick={activeNav === "blog" ? onBack : () => setActiveNav("blog")} aria-label={activeNav === "blog" ? "Back to blogs" : "Back to editor"} title={activeNav === "blog" ? "Back to blogs" : "Back to editor"}
              className="w-9 h-9 rounded-xl border border-[#D1D5DB] flex items-center justify-center text-[#1B1B1B] hover:bg-[#F3F4F6] hover:border-[#1B1B1B] transition-colors"><ArrowLeft size={16} /></button>
            <h1 className="text-[16px] font-extrabold text-[#111827] tracking-tight truncate">
              {activeNav === "blog" ? (isEditMode ? "Edit post" : "New post") : activeNav === "media" ? "Media library" : activeNav === "users" ? "Users" : "Redirects"}
            </h1>
            {activeNav === "blog" && isEditMode && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#FEF3C7", color: "#9a6b00" }}>Editing</span>}
            {activeNav === "blog" && publishMsg && publishStatus && (
              <span className="hidden md:inline text-[12px] font-semibold truncate max-w-[240px]" style={{ color: publishStatus === "success" ? "#059669" : publishStatus === "error" ? "#B91C1C" : "#6B7280" }}>{publishMsg}</span>
            )}

            <div className="ml-auto flex items-center gap-2">
              {activeNav === "blog" && canEdit && (<>
                <button type="button" onClick={() => document.getElementById("cms-publish-box")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border transition-colors"
                  style={readyDone === ready.length ? { background: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" } : { background: "#FFFBEB", color: "#92400E", borderColor: "#FDE68A" }}
                  title="Open the publish checklist">{readyDone === ready.length ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {readyDone}/{ready.length} ready</button>
                <button type="button" onClick={saveDraft} className="wp-secondary text-[12.5px]" style={{ borderRadius: 12, padding: "8px 14px" }}>Save draft</button>
                <div className="relative">
                  <button type="button" onClick={() => setShowDrafts((v) => !v)} className="wp-secondary text-[12.5px] flex items-center gap-1" style={{ borderRadius: 12, padding: "8px 12px" }}>Drafts ({drafts.length}) <ChevronDown size={12} /></button>
                  {showDrafts && (<>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDrafts(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
                      {drafts.length === 0 ? <div className="px-4 py-3 text-[12px] text-[#9CA3AF]">No saved drafts yet. Drafts are kept in this browser.</div> : drafts.map((d) => (
                        <div key={d.key} className="flex items-center gap-2 px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                          <button type="button" onClick={() => { loadDraft(d.key); setShowDrafts(false); }} className="flex-1 min-w-0 text-left">
                            <div className="text-[12.5px] font-semibold text-[#111827] truncate">{d.data?.meta?.title || "Untitled draft"}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{d.data?.savedAt ? new Date(d.data.savedAt).toLocaleString() : ""}</div>
                          </button>
                          <button type="button" onClick={() => deleteDraft(d.key)} aria-label="Delete draft" className="text-[#9CA3AF] hover:text-[#B91C1C]"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </>)}
                </div>
                <button type="button" onClick={() => { if (pendingImageUrl) insertContentImage(); const html = bodyRef.current ? bodyRef.current.innerHTML : ""; setBodySnapshot(html); setPreviewMode(true); }}
                  className="wp-secondary text-[12.5px] flex items-center gap-1.5" style={{ borderRadius: 12, padding: "8px 12px" }} title="Open the preview full screen"><Eye size={13} /> Full screen</button>
                {canPublish && (
                  <button type="button" onClick={requestPublish} disabled={publishStatus === "loading"} className="wp-primary flex items-center gap-1.5" style={{ borderRadius: 12 }}>
                    {publishStatus === "loading" ? <><Loader size={13} className="animate-spin" /> Working…</> : <><Send size={13} /> {isEditMode ? "Update" : "Publish"}</>}
                  </button>
                )}
              </>)}

              <div className="relative">
                <button type="button" onClick={() => setToolsOpen((v) => !v)} className="wp-secondary text-[12.5px] flex items-center gap-1" style={{ borderRadius: 12, padding: "8px 12px" }}>Tools <ChevronDown size={12} /></button>
                {toolsOpen && (<>
                  <div className="fixed inset-0 z-40" onClick={() => setToolsOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5">
                    {[["media", "Media library", MediaIcon, true], ["redirects", "Redirects", ArrowRight, canManageRedirects], ["users", "Users", UsersIcon, isAdmin]].filter((t) => t[3]).map(([id, label, Icon]) => (
                      <button key={id} type="button" onClick={() => { setActiveNav(id); setToolsOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#374151] hover:bg-[#F9FAFB] text-left"><Icon size={14} /> {label}</button>
                    ))}
                    <a href="/admin/seo-audit" className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#374151] hover:bg-[#F9FAFB]"><Globe size={14} /> Full-site SEO audit</a>
                    <div className="my-1 border-t border-[#F3F4F6]" />
                    <div className="px-3.5 py-1 text-[11px] text-[#9CA3AF] truncate">{user?.email}</div>
                    <button type="button" onClick={logout} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#374151] hover:bg-[#F9FAFB] text-left"><LogOut size={14} /> Sign out</button>
                  </div>
                </>)}
              </div>
            </div>
          </div>


          <div className="flex-1 min-h-0 flex gap-4 px-4 py-4 items-stretch overflow-hidden" style={{ background: "#F3F4F6" }}>
            {/* CONTENT COLUMN */}
            {activeNav === "home_blank" ? (
              <div className="flex-1 min-w-0 overflow-y-auto h-full" />
            ) : activeNav === "media" ? (
              <div className="flex-1 min-w-0 overflow-y-auto h-full">
                <MediaLibraryPage meta={meta} bodyRef={bodyRef} />
              </div>
            ) : activeNav === "users" ? (
              <div className="flex-1 min-w-0 overflow-y-auto h-full">
                <UsersPanel />
              </div>
            ) : activeNav === "redirects" ? (
              <div className="flex-1 min-w-0 overflow-y-auto h-full">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowRight size={18} className="text-[#1B1B1B]" />
                    <h2 className="text-[18px] font-extrabold text-[#111827]">Redirects</h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: "#ECFDF5", color: "#059669" }}>{cmsBlogs.length} blogs</span>
                  </div>
                  <p className="text-[13px] text-[#646970] mb-4">Edit any blog redirect slug. Changes commit directly to <code className="bg-[#F9FAFB] px-1.5 py-0.5 rounded text-[12px]">blogs.js</code> and update everywhere instantly.</p>
                  <RedirectsBox
                    ghToken={GH_TOKEN}
                    ghRepo={GH_REPO}
                    ghBranch={GH_BRANCH}
                    ghFile={GH_FILE}
                    fetchCurrentFile={fetchCurrentFile}
                    inline={true}
                  />
                </div>
              </div>
            ) : (
            <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
              {/* Title (H1) — fixed, does not scroll */}
              <div className="shrink-0 pb-3" style={{ background: "#F3F4F6" }}>
                <input
                  value={meta.title}
                  onChange={(e) => setMeta((p) => ({ ...p, slug: (p.slug || ""), title: e.target.value }))}
                  id="cms-title" placeholder="Add title" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.03em", padding: "18px 22px", borderRadius: "16px", border: "1.5px solid #E5E7EB", background: "#fff", color: "#0a0a0a", transition: "all 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-5 py-4 text-[1.7em] font-extrabold text-[#111827] placeholder:text-[#aab0a8] placeholder:font-semibold focus:outline-none focus:border-[#1B1B1B] focus:shadow-[0_0_0_3px_rgba(26,97,79,.12)] shadow-sm"
                />
              </div>
              {/* Scrollable content below title */}
              <div className="flex-1 overflow-y-auto">

              {!canEdit && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEF3C7] border border-[#F5A623]/40 text-[13px] text-[#9a6b00] font-semibold">
                  <ViewIcon size={15}/> You have <strong>view-only</strong> access — contact an admin for edit permissions.
                </div>
              )}
              {/* Permalink / slug */}
              <div className="mt-2 flex items-center flex-wrap gap-2 text-[13px] text-[#6B7280]">
                <span className="font-semibold">Permalink:</span>
                <span className="text-[#1B1B1B]">{SITE_BASE}</span>
                {slugEditing ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus
                      value={meta.slug}
                      onChange={(e) => setMeta((p) => ({ ...p, slug: e.target.value }))}
                      onBlur={(e) => { if (!e.target.value && meta.title) setMeta((p) => ({ ...p, slug: slugify(meta.title) })); setSlugEditing(false); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setSlugEditing(false); }}
                      placeholder="post-slug"
                      className="px-2 py-1 rounded border border-[#1B1B1B] bg-white text-[#111827] focus:outline-none min-w-[160px]"
                    />
                    <button onClick={() => setSlugEditing(false)} className="text-[11px] px-2 py-1 rounded bg-[#1B1B1B] text-white font-semibold">OK</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-1 rounded bg-[#F9FAFB] text-[#111827] font-mono text-[12px] border border-[#D1D5DB]">{meta.slug || "post-slug"}</span>
                    <button id="cms-slug" onClick={() => setSlugEditing(true)} title="Edit slug" className="w-6 h-6 rounded flex items-center justify-center text-[#6B7280] hover:text-[#1B1B1B] hover:bg-[#F3F4F6] transition-colors border border-[#D1D5DB]">
                      <Edit3 size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Add Media */}
              {canEdit && (
              <div className="mt-4 flex items-center gap-2">
                <button onClick={onImageClick} className="wp-secondary flex items-center gap-1.5">
                  {imageUploading ? <Loader size={13} className="animate-spin" /> : <ImageIcon size={13} />} Add Media
                </button>
                <span className="text-[11px] text-[#646970]">Insert an image at your cursor</span>
              </div>)}

              {/* Editor box */}
              <div className="mt-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex flex-col">
                {/* Toolbar — sticks to the top of the page scroll while you scroll the content below */}
                {canEdit && <div className="sticky top-0 z-10 shrink-0 border-b border-[#E5E7EB] rounded-t-2xl overflow-hidden">
                  <Toolbar
                    exec={exec}
                    onLink={onLink} onUnlink={onUnlink} onImage={onImageClick} onVideo={openVideo} onTable={openTablePicker} onFaq={insertFaq}
                    format={format} setFormat={handleFormatChange}
                    color={color} setColor={setColor}
                    imageUploading={imageUploading}
                    activeFormats={activeFormats}
                  />
                  <BlockAdder onAdd={insertBlock} />
                </div>}
                {/* Body — grows with content; scrolls with the outer page, not on its own */}
                
              {/* ── LINK POPOVER ── */}
              {linkPopover.open && (
                <div style={{
                  position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 20,
                  background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  padding: "18px 20px", width: 380, maxWidth: "calc(100vw - 40px)",
                  animation: "cms-fade-in 0.2s ease-out",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>Insert Link</span>
                    <button onClick={() => setLinkPopover({ open: false, url: "", text: "" })}
                      style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "#F3F4F6", cursor: "pointer", color: "#6B7280", fontSize: 14 }}>✕</button>
                  </div>
                  {linkPopover.text && (
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
                      Linking: <span style={{ color: "#111827", fontWeight: 600 }}>&quot;{linkPopover.text}&quot;</span>
                    </div>
                  )}
                  <input ref={linkInputRef} type="url" placeholder="https://www.example.com"
                    value={linkPopover.url}
                    onChange={(e) => setLinkPopover((p) => ({ ...p, url: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLinkFromPopover(); } if (e.key === "Escape") setLinkPopover({ open: false, url: "", text: "" }); }}
                    className="wp-input" style={{ marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setLinkPopover({ open: false, url: "", text: "" })}
                      className="wp-secondary" style={{ padding: "8px 16px" }}>Cancel</button>
                    <button onClick={insertLinkFromPopover} disabled={!linkPopover.url.trim()}
                      className="wp-primary" style={{ padding: "8px 20px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={13} /> Insert</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── VIDEO POPOVER ── */}
              {videoPopover.open && (
                <div style={{
                  position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 20,
                  background: "#fff", borderRadius: 16, border: "1.5px solid #E5E7EB",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  padding: "18px 20px", width: 420, maxWidth: "calc(100vw - 40px)",
                  animation: "cms-fade-in 0.2s ease-out",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>Insert Video</span>
                    <button onClick={() => setVideoPopover({ open: false, url: "" })}
                      style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "#F3F4F6", cursor: "pointer", color: "#6B7280", fontSize: 14 }}>✕</button>
                  </div>
                  <input autoFocus type="url" placeholder="https://www.youtube.com/watch?v=…  or  https://vimeo.com/…"
                    value={videoPopover.url}
                    onChange={(e) => setVideoPopover((p) => ({ ...p, url: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertVideoFromPopover(); } if (e.key === "Escape") setVideoPopover({ open: false, url: "" }); }}
                    className="wp-input" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 11.5, color: videoPopover.url.trim() ? (getEmbedSrc(videoPopover.url) ? "#059669" : "#DC2626") : "#9CA3AF", marginBottom: 12, minHeight: 16 }}>
                    {videoPopover.url.trim()
                      ? (getEmbedSrc(videoPopover.url) ? "Valid video URL detected — it will embed and play on the page." : "Not a recognized YouTube or Vimeo URL.")
                      : "Supports YouTube (watch, youtu.be, Shorts, embed, live) and Vimeo."}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setVideoPopover({ open: false, url: "" })}
                      className="wp-secondary" style={{ padding: "8px 16px" }}>Cancel</button>
                    <button onClick={insertVideoFromPopover} disabled={!getEmbedSrc(videoPopover.url)}
                      className="wp-primary" style={{ padding: "8px 20px" }}>Insert video</button>
                  </div>
                </div>
              )}

              <div
                  ref={bodyRef} id="cms-body"
                  className="wp-editor px-5 py-4 text-[15px]"
                  style={{ minHeight: "600px" }}
                  contentEditable={canEdit}
                  suppressContentEditableWarning
                  data-placeholder="Start writing your post…" style={{ minHeight: 420, padding: "28px 32px", fontSize: "15.5px", lineHeight: 1.85, color: "#374151", outline: "none" }}
                  onFocus={onEditorFocus}
                  onClick={onEditorClick}
                  onKeyDown={onEditorKeyDown}
                  onKeyUp={(e) => { syncFormatState(e); if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML); }}
                  onMouseUp={syncFormatState}
                  onInput={() => { if (bodyRef.current) setBodySnapshot(bodyRef.current.innerHTML); }}
                />
              </div>

              {/* hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleContentImage(e.target.files[0])} />

              {/* CONTENT IMAGE META PANEL */}
              {pendingImageUrl && (
                <div className="meta-box mt-4">
                  <div className="meta-box-head">
                    <span className="meta-box-title flex items-center gap-1.5"><ImageIcon size={13} /> {editingFigureRef.current ? "Edit image" : "Image details"}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Live preview with applied size */}
                    <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] flex" style={{
                      justifyContent: contentImageMeta.alignment === "left" ? "flex-start" : contentImageMeta.alignment === "right" ? "flex-end" : "center"
                    }}>
                      <img src={pendingImageUrl} alt="preview"
                        style={{
                          width: contentImageMeta.width ? contentImageMeta.width + "px" : "100%",
                          height: contentImageMeta.height ? contentImageMeta.height + "px" : "auto",
                          objectFit: (contentImageMeta.width || contentImageMeta.height) ? "cover" : undefined,
                          maxWidth: "100%",
                          display: "block",
                        }}
                      />
                    </div>

                    {/* File info strip */}
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] p-3 space-y-2">
                      <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">File information</p>
                      {/* Image URL (read-only, copyable) */}
                      <div>
                        <span className="block text-[10px] font-semibold text-[#9CA3AF] mb-0.5">Image URL</span>
                        <div className="flex items-center gap-1.5">
                          <input readOnly value={pendingImageUrl || ""}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 min-w-0 px-2 py-1 text-[11px] font-mono rounded border border-[#D1D5DB] bg-[#F9FAFB] text-[#1B1B1B] focus:outline-none focus:border-[#1B1B1B]"
                          />
                          <button type="button" title="Copy URL"
                            onClick={() => { try { navigator.clipboard.writeText(pendingImageUrl || ""); } catch (_) {} }}
                            className="shrink-0 px-2 py-1 text-[11px] font-semibold rounded border border-[#D1D5DB] text-[#1B1B1B] hover:bg-[#F3F4F6] transition-colors">
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Filename */}
                        <div>
                          <span className="block text-[10px] font-semibold text-[#9CA3AF] mb-0.5">Filename</span>
                          <input value={contentImageMeta.filename}
                            onChange={(e) => setContentImageMeta((p) => ({ ...p, filename: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-mono rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] bg-white"
                          />
                        </div>
                        {/* Format */}
                        <div>
                          <span className="block text-[10px] font-semibold text-[#9CA3AF] mb-0.5">Format</span>
                          <input value={contentImageMeta.fileFormat}
                            onChange={(e) => setContentImageMeta((p) => ({ ...p, fileFormat: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-mono rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] bg-white"
                          />
                        </div>
                        {/* File size */}
                        <div>
                          <span className="block text-[10px] font-semibold text-[#9CA3AF] mb-0.5">File size</span>
                          <input value={contentImageMeta.fileSize}
                            onChange={(e) => setContentImageMeta((p) => ({ ...p, fileSize: e.target.value }))}
                            className="w-full px-2 py-1 text-[11px] font-mono rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] bg-white"
                          />
                        </div>
                        {/* Dimensions (naturalW × naturalH) read-only info */}
                        <div>
                          <span className="block text-[10px] font-semibold text-[#9CA3AF] mb-0.5">Original dimensions</span>
                          <div className="px-2 py-1 text-[11px] font-mono rounded border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                            {contentImageMeta.naturalW && contentImageMeta.naturalH ? `${contentImageMeta.naturalW} × ${contentImageMeta.naturalH} px` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Size preset + Alignment */}
                    <div className="space-y-2">
                      <div>
                        <span className="block mb-1.5 text-[11px] font-semibold text-[#6B7280]">Image size</span>
                        <div className="flex gap-2">
                          {[["small","Small",0.33],["medium","Medium",0.66],["large","Large",1]].map(([val,lbl,scale])=>{
                            const pw=Math.round((Number(contentImageMeta.naturalW)||800)*scale);
                            const ph=Math.round((Number(contentImageMeta.naturalH)||600)*scale);
                            const active=contentImageMeta.sizePreset===val;
                            return(<button key={val} type="button" onClick={()=>setContentImageMeta((p)=>({...p,sizePreset:val,width:String(pw),height:String(ph)}))}
                              className="flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all"
                              style={active?{background:"#1B1B1B",color:"#fff",borderColor:"#1B1B1B"}:{background:"#F9FAFB",color:"#6B7280",borderColor:"#D1D5DB"}}>
                              {lbl}<span className="block text-[10px] font-normal opacity-70">{pw}×{ph}px</span>
                            </button>);
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Alignment</span>
                        <div className="flex gap-2">
                          {[["left","⬅ Left"],["center","⬛ Center"],["right","➡ Right"]].map(([val,lbl])=>(
                            <button key={val} type="button" onClick={()=>setContentImageMeta((p)=>({...p,alignment:val}))}
                              className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
                              style={contentImageMeta.alignment===val?{background:"#1B1B1B",color:"#fff",borderColor:"#1B1B1B"}:{background:"#F9FAFB",color:"#6B7280",borderColor:"#D1D5DB"}}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* YouTube video URL */}
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">YouTube video URL <span className="text-[#787c82] font-normal">(optional — adds play button overlay)</span></span>
                      <input
                        value={contentImageMeta.videoUrl}
                        onChange={(e) => setContentImageMeta((p) => ({ ...p, videoUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]"
                      />
                      {contentImageMeta.videoUrl && getYouTubeId(contentImageMeta.videoUrl) && (
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-[#059669] font-semibold">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>
                          Valid YouTube URL detected
                        </span>
                      )}
                    </label>

                    {/* Alt text */}
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Alt text <span className="text-[#787c82] font-normal">(SEO)</span></span>
                      <input
                        value={contentImageMeta.alt}
                        onChange={(e) => setContentImageMeta((p) => ({ ...p, alt: e.target.value }))}
                        placeholder="Describe the image for search engines"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]"
                      />
                    </label>

                    {/* Title */}
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Title</span>
                      <input
                        value={contentImageMeta.title}
                        onChange={(e) => setContentImageMeta((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Image title attribute"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]"
                      />
                    </label>

                    {/* Caption */}
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Caption</span>
                      <input
                        value={contentImageMeta.caption}
                        onChange={(e) => setContentImageMeta((p) => ({ ...p, caption: e.target.value }))}
                        placeholder="Shown below the image"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]"
                      />
                    </label>

                    {/* Description */}
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Description</span>
                      <textarea
                        rows={2}
                        value={contentImageMeta.description}
                        onChange={(e) => setContentImageMeta((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Longer description of the image"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] resize-none"
                      />
                    </label>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={insertContentImage} className="wp-primary flex items-center gap-1.5">
                        <ImageIcon size={13} /> {editingFigureRef.current ? "Update image" : "Insert into post"}
                      </button>
                      <button onClick={cancelContentImage} className="wp-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* FEATURED IMAGE — moved from the old right sidebar */}
              {canEdit && (<div className="mt-5">
              {/* FEATURED IMAGE BOX */}
              <div className="meta-box" id="cms-featured-image">
                <div className="meta-box-head"><span className="meta-box-title">Featured image</span></div>
                <div className="p-3">
                  {/* Thumbnail preview — shows play overlay when a video URL is set */}
                  {(meta.heroImage || heroPreview) ? (
                    <div className="relative group">
                      <img src={meta.heroImage || heroPreview} alt="featured" className="w-full h-28 object-cover rounded border border-slate-100" />
                      {heroUploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 text-white text-[11px] font-semibold gap-2">
                          <Loader size={13} className="animate-spin" /> Uploading…
                        </div>
                      )}
                      {/* Play overlay — only shown when videoUrl is filled */}
                      <button onClick={() => setMeta((p) => ({ ...p, heroImage: "" }))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10">×</button>
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded border border-dashed border-[#D1D5DB] bg-[#F9FAFB] flex flex-col items-center justify-center text-[#a7aaad] gap-1 select-none">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-[11px]">No featured image yet</span>
                    </div>
                  )}

                  <div className="mt-2">
                    <input ref={heroInputRef} type="file" accept="image/*" disabled={heroUploading} onChange={(e) => handleHeroImage(e.target.files[0])} />
                    {heroUploading && <div className="mt-2 flex items-center gap-2 text-xs text-[#1B1B1B] font-semibold"><Loader size={12} className="animate-spin" /> Uploading…</div>}
                  </div>

                  <div className="mt-2 space-y-2">
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Alt text <span className="text-[#787c82] font-normal">(SEO)</span></span>
                      <input id="cms-hero-alt" value={meta.imageAlt} onChange={(e) => setMeta((p) => ({ ...p, imageAlt: e.target.value }))} placeholder="Describe the image for search engines"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
                    </label>
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Title</span>
                      <input value={meta.imageTitle} onChange={(e) => setMeta((p) => ({ ...p, imageTitle: e.target.value }))} placeholder="Image title attribute"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
                    </label>
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Caption</span>
                      <input value={meta.imageCaption} onChange={(e) => setMeta((p) => ({ ...p, imageCaption: e.target.value }))} placeholder="Shown below the image"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
                    </label>
                    <label className="block">
                      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">Description</span>
                      <textarea rows={2} value={meta.imageDescription} onChange={(e) => setMeta((p) => ({ ...p, imageDescription: e.target.value }))} placeholder="Longer description of the image"
                        className="w-full px-2.5 py-1.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] resize-none" />
                    </label>
                  </div>
                </div>
              </div>

              </div>)}

              {/* POST SETTINGS / SEO BOX */}
              <div className="meta-box mt-5">
                <button className="meta-box-head w-full" onClick={() => setShowSettings((v) => !v)}>
                  <span className="meta-box-title flex items-center gap-1.5"><Settings size={13} /> Post settings &amp; SEO</span>
                  <ChevronDown size={15} className={`text-[#787c82] transition-transform ${showSettings ? "rotate-180" : ""}`} />
                </button>
                {showSettings && (
                  <div className="p-3 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="cms-meta-title" className="text-[11px] font-semibold text-[#6B7280]">SEO title <span className="font-normal text-[#9CA3AF]">(shown in Google)</span></label>
                        <span className="text-[11px] font-bold" style={{ color: meta.metaTitle.length >= 30 && meta.metaTitle.length <= 60 ? "#059669" : "#9CA3AF" }}>{meta.metaTitle.length}/60</span>
                      </div>
                      <input id="cms-meta-title" value={meta.metaTitle} onChange={(e) => setMeta((p) => ({ ...p, metaTitle: e.target.value }))} placeholder="Page title | Abhi Cabs" className="wp-input" />
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">Best at 30–60 characters. If empty, the headline is used.</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="cms-meta-desc" className="text-[11px] font-semibold text-[#6B7280]">Meta description <span className="font-normal text-[#9CA3AF]">(shown under the title in Google)</span></label>
                        <span className="text-[11px] font-bold" style={{ color: meta.description.length >= 120 && meta.description.length <= 160 ? "#059669" : "#9CA3AF" }}>{meta.description.length}/160</span>
                      </div>
                      <textarea id="cms-meta-desc" rows={3} value={meta.description} onChange={(e) => setMeta((p) => ({ ...p, description: e.target.value }))} placeholder="One or two sentences that make people want to click…" className="wp-input resize-none" />
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">Best at 120–160 characters. Also shown on the Blog page cards.</p>
                    </div>
                    <div>
                      <label htmlFor="cms-focus-kw" className="text-[11px] font-semibold text-[#6B7280] block mb-1">Focus keyword <span className="font-normal text-[#9CA3AF]">(what people search for)</span></label>
                      <input id="cms-focus-kw" value={meta.keywords} onChange={(e) => setMeta((p) => ({ ...p, keywords: e.target.value }))} placeholder="bangalore to mysore cab" className="wp-input" />
                    </div>
                    <Field label="Author"><input value={meta.author} onChange={(e) => setMeta((p) => ({ ...p, author: e.target.value }))} className="wp-input" /></Field>
                    <BlogStructureFields
                      category={meta.category} tags={meta.tags} categories={[...new Set(cmsBlogs.map((b) => b.category).filter(Boolean))]}
                      onChange={(patch) => setMeta((p) => ({ ...p, ...patch }))}
                    />
                  </div>
                )}
              </div>

              {/* SCHEMAS CONTAINER */}
              <div className="meta-box mt-5">
                <button className="meta-box-head w-full" onClick={() => setShowSchema((v) => !v)}>
                  <span className="meta-box-title flex items-center gap-1.5">
                    <Code2 size={13} /> Schemas{enabledSchemaCount ? ` (${enabledSchemaCount} active)` : ""}
                  </span>
                  <ChevronDown size={15} className={`text-[#787c82] transition-transform ${showSchema ? "rotate-180" : ""}`} />
                </button>
                {showSchema && (
                  <div className="p-4 space-y-3">
                    <p className="text-[12px] text-[#646970] leading-relaxed">
                      Turn on the schemas this post needs. Use <strong>Default</strong> to fill the fixed
                      fields, or <strong>Upload</strong> to paste your own JSON-LD. Each enabled schema is
                      added to the published page.
                    </p>

                    {SCHEMA_DEFS.map((def) => {
                      const cfg = schemas[def.id];
                      if (!cfg) return null;
                      return (
                        <div key={def.id} className="border border-[#E5E7EB] rounded">
                          {/* Section header: enable + mode + collapse */}
                          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={cfg.enabled}
                                onChange={(e) => setSchemaCfg(def.id, { enabled: e.target.checked })} />
                              <span className="text-[13px] font-bold text-[#111827]">{def.label}</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              {cfg.enabled && (
                                <div className="flex rounded overflow-hidden border border-[#D1D5DB] text-[11px] font-semibold shrink-0">
                                  {[["default", "Default"], ["upload", "Upload"]].map(([m, lbl]) => (
                                    <button key={m} type="button" onClick={() => setSchemaCfg(def.id, { mode: m })}
                                      className={`px-2.5 py-1 ${cfg.mode === m ? "bg-[#1B1B1B] text-white" : "bg-white text-[#1B1B1B]"}`}>
                                      {lbl}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {cfg.enabled && (
                                <button type="button" onClick={() => setCollapsedSchemas((p) => ({ ...p, [def.id]: !p[def.id] }))}
                                  className="text-[11px] px-2 py-0.5 rounded border border-[#D1D5DB] bg-white text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1B1B1B] transition-colors font-semibold">
                                  {collapsedSchemas[def.id] ? "Show" : "Hide"}
                                </button>
                              )}
                            </div>
                          </div>

                          {cfg.enabled && !collapsedSchemas[def.id] && (
                            <div className="p-3">
                              {/* ── Upload mode ── */}
                              {cfg.mode === "upload" ? (
                                <>
                                  <textarea
                                    rows={6}
                                    value={cfg.json}
                                    onChange={(e) => setSchemaCfg(def.id, { json: e.target.value })}
                                    placeholder={`Paste your ${def.label} JSON or full <script type="application/ld+json"> block…`}
                                    className="wp-input resize-y"
                                    style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px" }}
                                  />
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-[11px]">
                                      {cfg.json.trim()
                                        ? (parseJsonLd(cfg.json)
                                            ? <span className="text-[#059669]">✓ Valid JSON-LD</span>
                                            : <span className="text-[#b32d2e]">⚠ Invalid JSON — check the syntax.</span>)
                                        : <span className="text-[#787c82]">Paste a schema, then Save to load it into the editable fields.</span>}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => saveUploadedSchema(def)}
                                      disabled={!cfg.json.trim() || !parseJsonLd(cfg.json)}
                                      className="wp-button-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    >
                                      Save &amp; edit
                                    </button>
                                  </div>
                                </>
                              ) : def.kind === "object" ? (
                                /* ── Default mode: editable key→value pairs of the schema ── */
                                <div>
                                {schemaSavedId === def.id && (
                                  <p className="mb-2 text-[11px] text-[#059669] font-semibold">✓ Saved — values loaded below, edit as needed.</p>
                                )}
                                <div className="grid grid-cols-[150px_1fr] gap-x-2 gap-y-2 items-start">
                                  {flattenLeaves(cfg.data).map(({ path, value }) => {
                                    const { key, parent } = pathLabel(path);
                                    const long = typeof value === "string" && value.length > 60;
                                    return (
                                      <React.Fragment key={path}>
                                        <span className="text-[11px] pt-2 leading-tight">
                                          <span className="font-semibold text-[#111827]">{key}</span>
                                          {parent && <span className="block text-[10px] text-[#a7aaad]">{parent}</span>}
                                        </span>
                                        {long ? (
                                          <textarea rows={3} value={value}
                                            onChange={(e) => setSchemaPath(def.id, path, e.target.value)}
                                            className="wp-input resize-y" />
                                        ) : (
                                          <input value={value}
                                            onChange={(e) => setSchemaPath(def.id, path, e.target.value)}
                                            className="wp-input" />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {schemaSavedId === def.id && (
                                    <p className="text-[11px] text-[#059669] font-semibold">✓ Saved — values loaded, edit as needed.</p>
                                  )}
                                  {(cfg.data.items || []).map((it, idx) => (
                                    <div key={idx} className="border border-[#E5E7EB] rounded p-2 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-[#787c82]">#{idx + 1}</span>
                                        <button onClick={() => removeSchemaItem(def.id, idx)}
                                          className="text-[11px] text-[#b32d2e] hover:underline">Remove</button>
                                      </div>
                                      {def.itemFields.map((f) => (
                                        f.type === "textarea" ? (
                                          <textarea key={f.key} rows={2} value={it[f.key] || ""} placeholder={f.label}
                                            onChange={(e) => setSchemaItem(def.id, idx, f.key, e.target.value)}
                                            className="wp-input resize-y" />
                                        ) : (
                                          <input key={f.key} value={it[f.key] || ""} placeholder={f.label}
                                            onChange={(e) => setSchemaItem(def.id, idx, f.key, e.target.value)}
                                            className="wp-input" />
                                        )
                                      ))}
                                    </div>
                                  ))}
                                  {def.id === "faq" && (
                                    <button type="button" onClick={() => {
                                      const items = extractFaqFromBody();
                                      if (!items.length) { alert("No FAQ blocks found in the editor. Insert Q&A using the FAQ button in the toolbar first."); return; }
                                      setSchemaData(def.id, "items", items);
                                    }} className="wp-secondary flex items-center gap-1">
                                      ↺ Sync from editor
                                    </button>
                                  )}
                                  <button onClick={() => addSchemaItem(def.id, def)} className="wp-secondary flex items-center gap-1">
                                    <Plus size={12} /> {def.addLabel}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div>
                      <button onClick={() => setShowJsonLd((v) => !v)} className="wp-link flex items-center gap-1">
                        {showJsonLd ? "Hide" : "View"} generated JSON-LD
                      </button>
                      {showJsonLd && (
                        <pre className="mt-2 max-h-72 overflow-auto rounded bg-[#111827] text-[#9be8c0] text-[11px] leading-relaxed p-3 row-scroll whitespace-pre-wrap">{jsonLdPreview || "// Enable a schema to see its JSON-LD"}</pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PUBLISH + SEO — moved from the old right sidebar */}
              <div className="mt-5 pb-10" id="cms-publish-box">
              <a href="/admin/seo-audit"
                className="meta-box"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 10, textDecoration: "none", color: "#111827" }}>
                <Globe size={15} style={{ color: "#F5A623" }} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800 }}>Full-site SEO audit</span>
                <ArrowRight size={14} style={{ color: "#9CA3AF" }} />
              </a>
              <SeoAnalyzer
                title={meta.title}
                metaTitle={meta.metaTitle}
                metaDescription={meta.description}
                slug={meta.slug}
                keywords={meta.keywords}
                bodyHtml={bodySnapshot}
              />
                {canEdit && (<>
              {/* PUBLISH BOX (matches reference) */}
              <div className="meta-box">
                <div className="meta-box-head">
                  <span className="meta-box-title">Publish</span>
                  <ChevronsUpDown size={15} className="text-[#787c82]" />
                </div>
                <div className="p-3">
                  <PublishChecklist meta={meta} wordCount={bodyWordCount} onFix={jumpToField} />
                  <div className="flex justify-end mb-3">
                    <button onClick={() => { if (pendingImageUrl) insertContentImage(); const html = bodyRef.current ? bodyRef.current.innerHTML : ""; setBodySnapshot(html); setPreviewMode(true); }} className="wp-secondary">Preview Changes</button>
                  </div>
                  <ul className="space-y-2.5 text-[13px] text-[#6B7280]">
                    <li className="flex items-center gap-2">
                      <CircleDot size={14} className="text-[#787c82]" />
                      Status: <strong className="text-[#111827]">Published</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe size={14} className="text-[#787c82]" />
                      Visibility: <strong className="text-[#111827]">Public</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#787c82]" />
                      {editingDate ? (
                        <input autoFocus value={meta.date} onBlur={() => setEditingDate(false)}
                          onChange={(e) => setMeta((p) => ({ ...p, date: e.target.value }))}
                          className="px-2 py-0.5 text-[12px] rounded border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
                      ) : (
                        <span>Published on: <strong className="text-[#111827]">{meta.date || "—"}</strong></span>
                      )}
                      {!editingDate && <button className="wp-link" onClick={() => setEditingDate(true)}>Edit</button>}
                    </li>
                  </ul>

                  {(publishStatus === "success" || publishStatus === "error") && (
                    <div className={`mt-3 flex items-start gap-2 rounded px-2.5 py-2 text-[12px] font-medium ${publishStatus === "success" ? "bg-[#edfaef] text-[#059669] border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {publishStatus === "success" ? <CheckCircle size={13} className="mt-0.5 shrink-0" /> : <AlertCircle size={13} className="mt-0.5 shrink-0" />}
                      {publishMsg}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <button onClick={discardAndLeave} className="text-[12px] text-[#b32d2e] hover:text-[#8a2424] hover:underline" title="Leave the editor without publishing">Discard changes</button>
                    {canPublish ? (
                    <button onClick={requestPublish} disabled={publishStatus === "loading"} className="wp-primary flex items-center gap-1.5">
                      {publishStatus === "loading" ? <><Loader size={13} className="animate-spin" /> Updating…</> : <><Send size={13} /> {isEditMode ? "Update" : "Publish"}</>}
                    </button>
                    ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[12px] font-semibold flex items-center gap-1.5"><ViewIcon size={13} /> View only</span>
                    )}
                  </div>
                </div>
              </div>

                </>)}
              </div>
              </div>
            </div>
            )}

            {/* LIVE PREVIEW PANE */}
            {activeNav === "blog" && (
              <div className="hidden lg:flex flex-col shrink-0 h-full min-h-0" style={{ width: "46%", maxWidth: 800 }}>
                <BlogLivePreview meta={meta} sections={liveSections} onPlayVideo={(url) => setImageVideoPopup({ videoUrl: url })} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media Library Page ────────────────────────────────────────────────────────
function MediaLibraryPage({ meta, bodyRef }) {
  const [query, setQuery]             = useState("");
  const [copied, setCopied]           = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Derive current blog images from meta (featured) + editor body (content)
  const currentImages = useMemo(() => {
    const imgs = [];
    // Featured image
    if (meta?.heroImage) {
      const url = meta.heroImage;
      const parts = url.split("/"); const raw = parts[parts.length - 1] || "";
      const filename = raw.split("?")[0];
      const ext = filename.split(".").pop().toUpperCase();
      imgs.push({ url, type: "featured", name: filename, fileFormat: ext, fileSize: "", naturalW: "", naturalH: "" });
    }
    // Content images from editor body
    if (bodyRef?.current) {
      const imgEls = bodyRef.current.querySelectorAll("img");
      imgEls.forEach((img) => {
        const url = img.getAttribute("src");
        if (!url || imgs.find((m) => m.url === url)) return;
        const parts = url.split("/"); const raw = parts[parts.length - 1] || "";
        const filename = raw.split("?")[0];
        const ext = filename.split(".").pop().toUpperCase();
        imgs.push({
          url, type: "content",
          name: img.getAttribute("data-filename") || filename,
          fileFormat: img.getAttribute("data-format") || ext,
          fileSize: img.getAttribute("data-filesize") || "",
          naturalW: img.getAttribute("data-width") || String(img.naturalWidth || ""),
          naturalH: img.getAttribute("data-height") || String(img.naturalHeight || ""),
        });
      });
    }
    return imgs;
  }, [meta?.heroImage, bodyRef?.current?.innerHTML]);

  // Auto-detect naturalW/H for images that don't have them yet
  const [dims, setDims] = useState({});
  useEffect(() => {
    currentImages.forEach(({ url, naturalW, naturalH }) => {
      if ((!naturalW || !naturalH) && !dims[url]) {
        const img = new window.Image();
        img.onload = () => setDims((p) => ({ ...p, [url]: { w: String(img.naturalWidth), h: String(img.naturalHeight) } }));
        img.src = url;
      }
    });
  }, [currentImages]);

  const enriched = currentImages.map((m) => ({
    ...m,
    naturalW: m.naturalW || dims[m.url]?.w || "",
    naturalH: m.naturalH || dims[m.url]?.h || "",
  }));

  const filtered = enriched.filter((m) =>
    !query || m.name?.toLowerCase().includes(query.toLowerCase()) || m.url?.toLowerCase().includes(query.toLowerCase())
  );

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 2000); });
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MediaIcon size={18} className="text-[#1B1B1B]" />
          <h2 className="text-[18px] font-extrabold text-[#111827]">Media Library</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>{enriched.length} files</span>
        </div>
      </div>
      <p className="text-[13px] text-[#646970] -mt-3">Images in the currently open blog — featured image and content images from the editor.</p>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by filename or URL…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg border border-[#D1D5DB] bg-white focus:outline-none focus:border-[#1B1B1B]" />
      </div>

      {/* Grid */}
      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F9FAFB" }}>
            <MediaIcon size={28} className="text-[#C9C9C9]" />
          </div>
          <p className="text-[15px] font-bold text-[#6B7280]">No media yet</p>
          <p className="text-[13px] text-[#9CA3AF] mt-1">Add a featured image or insert images into the editor — they will appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-[#646970]">No media matches your search.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.url} className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="aspect-video overflow-hidden relative group cursor-pointer" onClick={()=>setPreview(item)}>
                <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/>
                <div className="absolute top-2 left-2"><span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{background:item.type==="featured"?"#FEF3C7":"#ECFDF5",color:item.type==="featured"?"#9a6b00":"#059669"}}>{item.type==="featured"?"Featured":"Content"}</span></div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={(e)=>{e.stopPropagation();copyUrl(item.url);}} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-[#1B1B1B] hover:bg-white">{copied===item.url?<CheckCircle size={15} className="text-[#059669]"/>:<LinkIcon size={15}/>}</button>

                </div>
              </div>
              <div className="px-2 py-1.5 bg-white border-t border-[#E5E7EB]">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#111827] truncate">{item.name||"Untitled"}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.fileFormat&&<span className="text-[9px] font-bold px-1 rounded bg-slate-100 text-slate-500">{item.fileFormat}</span>}
                      {item.fileSize&&<span className="text-[9px] text-[#9CA3AF]">{item.fileSize}</span>}
                      {(item.naturalW&&item.naturalH)&&<span className="text-[9px] text-[#9CA3AF]">{item.naturalW}×{item.naturalH}px</span>}
                    </div>
                    <p className="text-[9px] text-[#C9C9C9] mt-0.5">{formatDate(item.addedAt)}</p>
                  </div>
                  <button onClick={()=>setViewingItem(item)} className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded border border-[#D1D5DB] text-[#1B1B1B] hover:bg-[#F3F4F6] transition-colors">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview lightbox */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={viewingItem.url} alt={viewingItem.name} className="w-full max-h-[60vh] object-contain bg-[#F9FAFB]" />
            <div className="p-4 flex gap-2">
              <button onClick={() => copyUrl(viewingItem.url)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#1B1B1B] text-[#1B1B1B] hover:bg-[#F3F4F6]">
                {copied === viewingItem.url ? <><CheckCircle size={13}/> Copied!</> : <><LinkIcon size={13}/> Copy URL</>}
              </button>

              <button onClick={() => setViewingItem(null)} className="ml-auto px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#F9FAFB] text-[#6B7280]">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View detail modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={viewingItem.url} alt={viewingItem.name} className="w-full max-h-56 object-cover bg-[#F9FAFB]" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-extrabold text-[#111827]">File details</h3>
                <button onClick={() => setViewingItem(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 font-bold text-lg">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Filename",   viewingItem.name || "—"],
                  ["Format",     viewingItem.fileFormat || "—"],
                  ["File size",  viewingItem.fileSize || (viewingItem.size ? formatSize(viewingItem.size) : "—")],
                  ["Dimensions", (viewingItem.naturalW && viewingItem.naturalH) ? `${viewingItem.naturalW} × ${viewingItem.naturalH} px` : "—"],
                  ["Type",       viewingItem.type === "featured" ? "Featured image" : "Content image"],
                  ["Added",      viewingItem.addedAt ? formatDate(viewingItem.addedAt) : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#F9FAFB] rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-[13px] font-semibold text-[#111827] break-all">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#F9FAFB] rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-0.5">URL</p>
                <p className="text-[11px] font-mono text-[#1B1B1B] break-all">{viewingItem.url}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => copyUrl(viewingItem.url)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold border border-[#1B1B1B] text-[#1B1B1B] hover:bg-[#F3F4F6] transition-colors">
                  {copied === viewingItem.url ? <><CheckCircle size={14}/> Copied!</> : <><LinkIcon size={14}/> Copy URL</>}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Panel ──────────────────────────────────────────────────────────────
// Reads/writes real accounts in MongoDB ("blog_users" collection) via the
// backend's /api/users endpoints, instead of committing a GitHub file.
function UsersPanel() {
  const { token } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [banner, setBanner]   = useState(null);

  // Add-user form
  const [newEmail, setNewEmail]       = useState("");
  const [newName, setNewName]         = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole]         = useState("viewer");
  const [showNewPw, setShowNewPw]     = useState(false);

  // Edit popup
  const [editUser, setEditUser]       = useState(null); // the user object being edited
  const [editName, setEditName]       = useState("");
  const [editEmail, setEditEmail]     = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole]       = useState("viewer");
  const [showEditPw, setShowEditPw]   = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/blog/users`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Fetch failed: HTTP ${res.status}`);
      const items = data.data?.items || data.data || data.users || []; setUsers(Array.isArray(items) ? items : []);
    } catch (e) { setBanner({ type: "err", msg: e.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, []);

  const addUser = async () => {
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) { setBanner({ type: "err", msg: "All fields are required" }); return; }
    if (users.find((u) => u.email === newEmail.trim())) { setBanner({ type: "err", msg: "Email already exists" }); return; }
    setBusy(true); setBanner(null);
    try {
      const res = await fetch(`${API_BASE}/blog/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword.trim(), role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not add user");
      const newUser = data.data?.user || data.data || data.user; if (newUser) setUsers((prev) => [newUser, ...prev]);
      setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("viewer");
      setBanner({ type: "ok", msg: "Saved!" });
      setTimeout(() => setBanner(null), 2500);
    } catch (e) { setBanner({ type: "err", msg: e.message }); }
    finally { setBusy(false); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Remove ${u.email}?`)) return;
    setBusy(true); setBanner(null);
    try {
      const res = await fetch(`${API_BASE}/blog/users/${u.id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not remove user");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setBanner({ type: "ok", msg: "Saved!" });
      setTimeout(() => setBanner(null), 2500);
    } catch (e) { setBanner({ type: "err", msg: e.message }); }
    finally { setBusy(false); }
  };

  const openEdit = (u) => {
    setEditUser(u); setEditName(u.name); setEditEmail(u.email);
    setEditPassword(u.password || ""); setEditRole(u.role || "viewer"); setShowEditPw(false);
  };

  const saveEdit = async () => {
    if (!editEmail.trim() || !editName.trim()) { setBanner({ type: "err", msg: "Name and email are required" }); return; }
    setBusy(true); setBanner(null);
    try {
      const res = await fetch(`${API_BASE}/blog/users/${editUser.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          ...(editPassword.trim() && editPassword.trim() !== editUser.password ? { password: editPassword.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update user");
      const updated = data.data?.user || data.data || data.user; setUsers((prev) => prev.map((x) => (x.id === editUser.id ? (updated || x) : x)));
      setEditUser(null);
      setBanner({ type: "ok", msg: "Saved!" });
      setTimeout(() => setBanner(null), 2500);
    } catch (e) { setBanner({ type: "err", msg: e.message }); }
    finally { setBusy(false); }
  };

  const ROLE_CONFIG = {
    viewer: { label: "Viewer", color: "#6B7280", bg: "#F9FAFB" },
    editor: { label: "Editor", color: "#6B7280", bg: "#F9FAFB" },
    admin:  { label: "Admin",  color: "#6B7280", bg: "#F9FAFB" },
  };

  const exportUsersExcel=()=>{const rows=[["ID","Name","Email","Role","Added On"]];users.forEach((u)=>rows.push([u.id,u.name,u.email,u.role,u.addedOn||""]));const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"users.csv"});a.click();URL.revokeObjectURL(a.href);};
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UsersIcon size={18} className="text-[#1B1B1B]" />
        <h2 className="text-[18px] font-extrabold text-[#111827]">Users</h2>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1" style={{ background: "#ECFDF5", color: "#059669" }}>{users.length} users</span>
        <button onClick={exportUsersExcel} disabled={users.length===0} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#D1D5DB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1B1B1B] hover:border-[#1B1B1B] transition-all disabled:opacity-40"><Upload size={12}/> Export Excel</button>
      </div>
      <p className="text-[13px] text-[#646970] -mt-4">Manage who can access the CMS and what they can do.</p>

      {banner && <div className={`text-[12px] font-semibold px-3 py-2 rounded-lg ${banner.type === "ok" ? "bg-[#ECFDF5] text-[#059669]" : "bg-red-50 text-red-600"}`}>{banner.msg}</div>}

      {/* Add user form */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "linear-gradient(135deg,#EAF7F0,#F0FBF5)", border: "1px solid #D5EAE0" }}>
        <h3 className="font-bold text-[15px] text-[#111827] flex items-center gap-2"><UsersIcon size={15} /> Add new user</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Email</label>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@email.com"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Password</label>
            <div className="relative">
              <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-3 py-2 pr-9 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]" />
              <button type="button" onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1B1B1B] text-[11px]">
                {showNewPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <button onClick={addUser} disabled={busy}
          className="w-full py-2.5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "#1B1B1B" }}>
          {busy ? <><Loader size={14} className="animate-spin" /> Adding…</> : <><UsersIcon size={14} /> Add user</>}
        </button>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#646970]"><Loader size={14} className="animate-spin" /> Loading users…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-[#646970]">No users yet. Add one above.</div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_80px_120px_90px_80px] gap-2 px-4 py-2 bg-[#F9FAFB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">
            <span>Name</span><span>Email</span><span>Password</span><span>Role</span><span>Added</span><span>Actions</span>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {users.map((u) => {
              const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.viewer;
              return (
                <div key={u.id} className="grid grid-cols-[1fr_1fr_80px_120px_90px_80px] gap-2 px-4 py-3 items-center bg-white text-[13px]">
                  <span className="font-semibold text-[#111827] truncate">{u.name}</span>
                  <span className="text-[#646970] truncate">{u.email}</span>
                  <span className="font-mono text-[12px] text-[#9CA3AF] tracking-widest">••••••</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-[#D1D5DB] text-[#6B7280] bg-[#F9FAFB]">{roleCfg.label}</span>
                  <span className="text-[11px] text-[#646970]">{u.addedOn || "—"}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} title="Edit" className="text-[#1B1B1B] hover:opacity-70"><Edit3 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Edit User Popup Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-[#111827] flex items-center gap-2"><Edit3 size={16} className="text-[#1B1B1B]" /> Edit User</h3>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 font-bold text-lg">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Name</label>
                <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Password <span className="font-normal text-[#9CA3AF]">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input type={showEditPw ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={showEditPw ? "Enter new password" : "••••••••"}
                    className="w-full px-3 py-2 pr-16 text-[13px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
                  <button type="button" onClick={() => setShowEditPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#1B1B1B] hover:opacity-70">
                    {showEditPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] bg-white">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {banner && <div className={`text-[12px] font-semibold px-3 py-2 rounded-lg ${banner.type === "ok" ? "bg-[#ECFDF5] text-[#059669]" : "bg-red-50 text-red-600"}`}>{banner.msg}</div>}

            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} disabled={busy}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#1B1B1B" }}>
                {busy ? <><Loader size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Save changes</>}
              </button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-[#6B7280] font-semibold text-[13px] hover:bg-[#F9FAFB] transition-colors">
                Cancel
              </button>
            </div>
            <div className="border-t border-[#F0EBE0] pt-3">
              <button onClick={() => { setEditUser(null); deleteUser(editUser); }} disabled={busy}
                className="w-full py-2 rounded-xl border border-red-200 text-red-500 font-semibold text-[13px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                Remove account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// --- Redirects Box (Ultimate Redirect style manager) -----------------------
function RedirectsBox({ ghToken, ghRepo, ghBranch, inline = false }) {
  const REDIRECTS_FILE = "src/data/redirects.js";

  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy]           = useState(false);
  const [banner, setBanner]       = useState(null); // { type:"ok"|"err", msg }

  // Add form
  const [fromUrl, setFromUrl] = useState("");
  const [toUrl, setToUrl]     = useState("");
  const [redirType, setRedirType] = useState("301");

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editFrom, setEditFrom]   = useState("");
  const [editTo, setEditTo]       = useState("");
  const [editType, setEditType]   = useState("301");
  // Popup edit modal
  const [editPopup, setEditPopup] = useState(null); // the redirect item being edited in popup

  const [query, setQuery] = useState("");

  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: "application/vnd.github.v3+json",
  };

  // Fetch redirects.js (handles file-not-found by starting empty)
  const fetchRedirects = async () => {
    setLoading(true); setLoadError("");
    try {
      const res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${REDIRECTS_FILE}?ref=${ghBranch}&t=${Date.now()}`,
        { headers: ghHeaders, cache: "no-store" });
      if (res.status === 404) { setRedirects([]); setLoading(false); return; }
      if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status}`);
      const fileData = await res.json();
      const binary = atob(fileData.content.replace(/\n/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const text = new TextDecoder("utf-8").decode(bytes);
      const stripped = text.replace(/^[\s\S]*?export\s+const\s+REDIRECTS\s*=\s*/, "").replace(/;?\s*$/, "").trim();
      // eslint-disable-next-line no-new-func
      const arr = new Function(`return ${stripped}`)();
      setRedirects(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setLoadError(e.message || "Failed to load redirects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRedirects(); /* eslint-disable-next-line */ }, []);

  // Commit the full redirects array back to redirects.js
  const commitRedirects = async (nextArr, message) => {
    setBusy(true); setBanner(null);
    try {
      // get current sha (if file exists)
      let sha = undefined;
      const head = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${REDIRECTS_FILE}?ref=${ghBranch}&t=${Date.now()}`,
        { headers: ghHeaders, cache: "no-store" });
      if (head.ok) { const d = await head.json(); sha = d.sha; }

      const entriesStr = nextArr.map((r) => "  " + JSON.stringify(r, null, 2).replace(/\n/g, "\n  ")).join(",\n");
      const newContent = `export const REDIRECTS = [\n${entriesStr}\n];\n`;

      const putRes = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${REDIRECTS_FILE}`, {
        method: "PUT",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          message, content: btoa(unescape(encodeURIComponent(newContent))),
          branch: ghBranch, ...(sha ? { sha } : {}),
        }),
      });
      if (!putRes.ok) { const err = await putRes.json().catch(() => ({})); throw new Error(err.message || `Commit failed: HTTP ${putRes.status}`); }

      setRedirects(nextArr);
      setBanner({ type: "ok", msg: "Saved!" });
      setTimeout(() => setBanner(null), 2500);
      return true;
    } catch (e) {
      setBanner({ type: "err", msg: e.message || "Save failed" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addRedirect = async () => {
    const from = fromUrl.trim();
    const to = toUrl.trim();
    if (!from || !to) { setBanner({ type: "err", msg: "Both URLs are required" }); return; }
    const newItem = {
      id: Date.now(),
      from, to, type: redirType,
      status: true,
      date: new Date().toLocaleDateString("en-GB"),
    };
    const ok = await commitRedirects([newItem, ...redirects], `add redirect: ${from} -> ${to}`);
    if (ok) { setFromUrl(""); setToUrl(""); setRedirType("301"); }
  };

  const toggleStatus = async (item) => {
    const next = redirects.map((r) => r.id === item.id ? { ...r, status: !r.status } : r);
    await commitRedirects(next, `toggle redirect ${item.from}`);
  };

  const deleteRedirect = async (item) => {
    const next = redirects.filter((r) => r.id !== item.id);
    await commitRedirects(next, `delete redirect ${item.from}`);
  };

  const startEdit = (item) => {
    setEditPopup(item);
    setEditFrom(item.from);
    setEditTo(item.to);
    setEditType(item.type || "301");
  };
  const cancelEdit = () => { setEditingId(null); setEditPopup(null); };
  const saveEdit = async (item) => {
    if (!editFrom.trim() || !editTo.trim()) { setBanner({ type: "err", msg: "Both URLs are required" }); return; }
    const next = redirects.map((r) => r.id === item.id ? { ...r, from: editFrom.trim(), to: editTo.trim(), type: editType } : r);
    const ok = await commitRedirects(next, `edit redirect ${item.from}`);
    if (ok) { setEditingId(null); setEditPopup(null); }
  };

  const filtered = redirects.filter((r) =>
    r.from?.toLowerCase().includes(query.toLowerCase()) ||
    r.to?.toLowerCase().includes(query.toLowerCase())
  );

  const exportRedirectsExcel=()=>{const rows=[["From","To","Type","Status","Date"]];redirects.forEach((r)=>rows.push([r.from,r.to,r.type||"301",r.status?"On":"Off",r.date||""]));const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"redirects.csv"});a.click();URL.revokeObjectURL(a.href);};
  const body = (
    <div className={inline ? "space-y-5" : "p-3 space-y-4"}>
      {/* ADD A REDIRECT */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#EAF7F0,#F0FBF5)", border: "1px solid #D5EAE0" }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <LinkIcon size={18} className="text-[#1B1B1B]" />
          <h3 className="text-[17px] font-extrabold text-[#111827]">Add a redirect</h3>
        </div>
        <div className={`flex ${inline ? "flex-row items-end" : "flex-col"} gap-3`}>
          <div className="flex-1 min-w-0">
            <label className="block text-[12px] text-[#6B7280] mb-1">Redirect from the <b>specific URL…</b></label>
            <input value={fromUrl} onChange={(e) => setFromUrl(e.target.value)} placeholder="Enter the URL you want to redirect"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]" />
          </div>
          <div className="flex items-center justify-center text-[#1B1B1B] pb-2"><ArrowRight size={20} /></div>
          <div className="flex-1 min-w-0">
            <label className="block text-[12px] text-[#6B7280] mb-1">…to a <b>specific URL:</b></label>
            <input value={toUrl} onChange={(e) => setToUrl(e.target.value)} placeholder="Enter the URL you want to redirect to"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#C9DED4] bg-white focus:outline-none focus:border-[#1B1B1B]" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-[12px] text-[#6B7280]">
          <span>…with type</span>
          <select value={redirType} onChange={(e) => setRedirType(e.target.value)}
            className="px-2 py-1 rounded border border-[#C9DED4] bg-white text-[12px] focus:outline-none focus:border-[#1B1B1B]">
            <option value="301">301 — Permanent</option>
            <option value="302">302 — Found</option>
            <option value="307">307 — Temporary</option>
          </select>
        </div>
        <button onClick={addRedirect} disabled={busy}
          className="w-full mt-4 py-3 rounded-xl text-white font-bold text-[15px] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "#1B1B1B" }}>
          {busy ? <><Loader size={15} className="animate-spin" /> Working…</> : "Add this redirect!"}
        </button>
        {banner && (
          <div className={`mt-3 text-center text-[12px] font-semibold ${banner.type === "ok" ? "text-[#059669]" : "text-red-600"}`}>{banner.msg}</div>
        )}
      </div>

      {/* YOUR REDIRECTS */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div><h3 className="text-[17px] font-extrabold text-[#111827]">Your redirects</h3><p className="text-[12px] text-[#646970]">{redirects.length} specific URL redirects</p></div>
          <button onClick={exportRedirectsExcel} disabled={redirects.length===0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#D1D5DB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1B1B1B] hover:border-[#1B1B1B] transition-all disabled:opacity-40"><Upload size={12}/> Export Excel</button>
        </div>

        <div className="flex items-center justify-end mb-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search"
              className="pl-7 pr-3 py-1.5 text-[12px] rounded-lg border border-[#D1D5DB] bg-white focus:outline-none focus:border-[#1B1B1B] w-40" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6 text-[13px] text-[#646970] flex items-center justify-center gap-2"><Loader size={14} className="animate-spin" /> Loading redirects…</div>
        ) : loadError ? (
          <div className="text-center py-6 text-[13px] text-red-600">{loadError}</div>
        ) : (
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            {/* header row */}
            <div className="hidden sm:grid grid-cols-[44px_1fr_1fr_84px_56px_60px] gap-2 px-3 py-2 bg-[#F9FAFB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">
              <span>Status</span><span>Redirect from…</span><span>…to:</span><span>Date</span><span>Type</span><span>Actions</span>
            </div>
            <div className="divide-y divide-[#F3F4F6] max-h-[50vh] overflow-auto row-scroll">
              {filtered.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div key={item.id} className="grid grid-cols-[44px_1fr_1fr_84px_56px_60px] gap-2 px-3 py-2.5 items-center bg-white text-[12px]">
                    {/* status toggle */}
                    <button onClick={() => toggleStatus(item)} disabled={busy}
                      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                      style={{ background: item.status ? "#1B1B1B" : "#C9C9C9" }} title={item.status ? "On" : "Off"}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: item.status ? "22px" : "2px" }} />
                    </button>
                    {/* from */}
                    <span className="font-mono text-[11px] text-[#111827] truncate" title={item.from}>{item.from}</span>
                    {/* to */}
                    <span className="font-mono text-[11px] text-[#1B1B1B] truncate" title={item.to}>{item.to}</span>
                    {/* date */}
                    <span className="text-[11px] text-[#646970]">{item.date}</span>
                    {/* type */}
                    <span className="text-[11px] font-bold text-[#111827]">{item.type || "301"}</span>
                    {/* actions */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(item)} title="Edit" className="text-[#1B1B1B] hover:opacity-70"><Edit3 size={14} /></button>
                      <button onClick={() => deleteRedirect(item)} disabled={busy} title="Delete" className="text-red-500 hover:opacity-70 font-bold text-[14px] leading-none">×</button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-6 text-[13px] text-[#646970]">{redirects.length === 0 ? "No redirects yet. Add one above." : `No redirects match "${query}"`}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Edit Redirect Popup ──────────────────────────────────────────────────────
  const editPopupModal = editPopup ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditPopup(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-extrabold text-[#111827] flex items-center gap-2"><Edit3 size={16} className="text-[#1B1B1B]" /> Edit Redirect</h3>
          <button onClick={() => setEditPopup(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 font-bold text-lg">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Redirect from</label>
            <input autoFocus value={editFrom} onChange={(e) => setEditFrom(e.target.value)}
              className="w-full px-3 py-2 text-[13px] font-mono rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
          </div>
          <div className="flex items-center justify-center"><ArrowRight size={18} className="text-[#1B1B1B]" /></div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Redirect to</label>
            <input value={editTo} onChange={(e) => setEditTo(e.target.value)}
              className="w-full px-3 py-2 text-[13px] font-mono rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Type</label>
            <select value={editType} onChange={(e) => setEditType(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D1D5DB] focus:outline-none focus:border-[#1B1B1B] bg-white">
              <option value="301">301 — Permanent</option>
              <option value="302">302 — Found</option>
              <option value="307">307 — Temporary</option>
            </select>
          </div>
        </div>
        {banner && <div className={`text-[12px] font-semibold px-3 py-2 rounded-lg ${banner.type === "ok" ? "bg-[#ECFDF5] text-[#059669]" : "bg-red-50 text-red-600"}`}>{banner.msg}</div>}
        <div className="flex gap-2 pt-1">
          <button onClick={() => saveEdit(editPopup)} disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#1B1B1B" }}>
            {busy ? <><Loader size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Save redirect</>}
          </button>
          <button onClick={() => setEditPopup(null)} className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-[#6B7280] font-semibold text-[13px] hover:bg-[#F9FAFB] transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  if (inline) return <>{body}{editPopupModal}</>;

  return (
    <div className="meta-box">
      <button className="meta-box-head w-full" onClick={() => {}}>
        <span className="meta-box-title flex items-center gap-1.5"><LinkIcon size={13} /> Redirects</span>
      </button>
      {body}
      {editPopupModal}
    </div>
  );
}

// small labelled field used in the settings box
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-[11px] font-semibold text-[#6B7280]">{label}</span>
      {children}
    </label>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// PAGE EDITOR — edit main website pages (About, Outstation, Vehicles, Contact)
// ═════════════════════════════════════════════════════════════════════════════


// ═════════════════════════════════════════════════════════════════════════════
// PAGE BUILDER — full CMS for editing main website pages
// ═════════════════════════════════════════════════════════════════════════════

// Built-in homepage sections the layout editor can reorder / show-hide.
// Keys and order MUST match DEFAULT_HOME_ORDER in pages/index/+Page.jsx.
const HOME_LAYOUT_ORDER = ["trustbadges", "servicestrip", "freecancel", "fleet", "grouptransport", "promobanners", "whyus", "routes", "coverage", "howitworks", "stats", "reviews", "journey", "seocontent", "faq", "cta"];
const HOME_LAYOUT_LABELS = {
  trustbadges: "Trust badges", servicestrip: "Service strip", freecancel: "Free-cancellation banner",
  fleet: "Choose Your Ride (fleet)", grouptransport: "Group transport banner", promobanners: "Promo banners",
  whyus: "Why AbhiCabs", routes: "Popular routes", coverage: "Coverage / cities", howitworks: "How it works",
  stats: "Stats bar", reviews: "Reviews", journey: "Journey categories", seocontent: "SEO text content",
  faq: "FAQ", cta: "Final call-to-action",
};

const PAGE_DEFS = [
  { id: "home", label: "Home", icon: "🏠", desc: "Hero section, features, and booking widget intro" },
  { id: "about", label: "About", icon: "📖", desc: "Company story, mission, stats, and team" },
  { id: "outstation", label: "Outstation", icon: "🛣️", desc: "Routes, trip types, pricing info" },
  { id: "fleet", label: "Vehicles", icon: "🚗", desc: "Fleet showcase, vehicle types, features" },
  { id: "contact", label: "Contact", icon: "📞", desc: "Phone, email, FAQs, contact form" },
  { id: "blogs", label: "Blogs", icon: "📝", desc: "Blog listing hero and categories" },
];

// Section types that can be added to any page
const SECTION_TYPES = [
  { type: "hero", label: "Hero Banner", icon: "🎯", desc: "Full-width hero with title, subtitle, and CTA" },
  { type: "text", label: "Text Block", icon: "📝", desc: "Rich text paragraph with optional heading" },
  { type: "image", label: "Image", icon: "🖼️", desc: "Full-width or inline image with caption" },
  { type: "video", label: "Video Embed", icon: "🎬", desc: "YouTube or Vimeo embed" },
  { type: "stats", label: "Stats Row", icon: "📊", desc: "Number highlights (e.g. 10,000+ rides)" },
  { type: "features", label: "Feature Grid", icon: "✨", desc: "Grid of feature cards with icons" },
  { type: "cta", label: "Call to Action", icon: "🔗", desc: "Button or link banner" },
  { type: "faq", label: "FAQ", icon: "❓", desc: "Accordion of questions and answers" },
  { type: "gallery", label: "Image Gallery", icon: "📸", desc: "Multiple images in a grid" },
  { type: "links", label: "Link List", icon: "🔗", desc: "List of labeled links" },
  { type: "divider", label: "Divider", icon: "➖", desc: "Visual separator between sections" },
  { type: "testimonial", label: "Testimonials", icon: "💬", desc: "Customer quotes with name and photo" },
  { type: "team", label: "Team Members", icon: "👥", desc: "Team cards with photo, name, role" },
  { type: "banner", label: "Banner / Alert", icon: "📢", desc: "Colored announcement or promo strip" },
  { type: "accordion", label: "Accordion", icon: "📂", desc: "Collapsible content panels" },
  { type: "embed", label: "HTML / Embed", icon: "🧩", desc: "Custom HTML, maps, or widget code" },
  { type: "social", label: "Social Links", icon: "🌐", desc: "Social media profile links" },
];

function sectionDefaults(type) {
  switch (type) {
    case "hero": return { title: "", accent: "", description: "", image: "", ctaText: "Get Started", ctaLink: "/#booking" };
    case "text": return { heading: "", body: "" };
    case "image": return { url: "", alt: "", caption: "", width: "full" };
    case "video": return { embedUrl: "", caption: "" };
    case "stats": return { items: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] };
    case "features": return { items: [{ icon: "✅", title: "", description: "" }] };
    case "cta": return { heading: "", description: "", buttonText: "", buttonLink: "", style: "primary" };
    case "faq": return { items: [{ question: "", answer: "" }] };
    case "gallery": return { images: [{ url: "", alt: "", caption: "" }] };
    case "links": return { items: [{ label: "", url: "", description: "" }] };
    case "divider": return { style: "line" };
    case "testimonial": return { items: [{ quote: "", name: "", role: "", image: "" }] };
    case "team": return { items: [{ name: "", role: "", bio: "", image: "" }] };
    case "banner": return { text: "", style: "info", linkText: "", linkUrl: "" };
    case "accordion": return { items: [{ title: "", content: "" }] };
    case "embed": return { code: "", caption: "" };
    case "social": return { items: [{ platform: "Instagram", url: "" }] };
    default: return {};
  }
}

const DEFAULT_PAGE_CONTENT = {
  home: { sections: [
    { id: "h1", type: "hero", title: "Your Journey,", accent: "Our Priority.", description: "Reliable Cabs. Transparent Fares. Comfortable Travel. Book reliable cabs for airport transfers, local travel, one-way trip, round trip, group trip and outstation journeys.", image: "/images/Herosection.jpg", ctaText: "Get Instant Quote", ctaLink: "/#booking" },
    { id: "h2", type: "features", items: [
      { icon: "✅", title: "Verified Drivers", description: "KYC-verified and background-checked" },
      { icon: "💰", title: "Transparent Pricing", description: "See the exact fare before you book" },
      { icon: "🚗", title: "Comfortable Vehicles", description: "Clean, well-maintained fleet" },
      { icon: "📞", title: "24×7 Support", description: "Real people, not chatbots" },
    ]},
  ]},
  about: { sections: [
    { id: "a1", type: "hero", title: "About", accent: "Abhi Cabs", description: "A Bangalore-born cab service built around one idea: your journey is our responsibility.", image: "", ctaText: "", ctaLink: "" },
    { id: "a2", type: "text", heading: "Our Story", body: "Abhi Cabs started with a simple frustration: booking a reliable outstation cab shouldn't feel like a gamble." },
    { id: "a3", type: "stats", items: [{ value: "10,000+", label: "Rides completed" }, { value: "150+", label: "Verified drivers" }, { value: "25+", label: "Cities covered" }] },
  ]},
  outstation: { sections: [
    { id: "o1", type: "hero", title: "Outstation cabs,", accent: "priced before you ride", description: "Bangalore to anywhere in South India — one-way drops, round trips, and multi-city itineraries.", image: "", ctaText: "Get Instant Quote", ctaLink: "/#booking" },
  ]},
  fleet: { sections: [
    { id: "f1", type: "hero", title: "Every Vehicle.", accent: "Every Group Size.", description: "Sedans, SUVs, tempos and coaches — all verified, all ready for your journey.", image: "", ctaText: "Book a Vehicle", ctaLink: "/#booking" },
  ]},
  contact: { sections: [
    { id: "c1", type: "hero", title: "Contact &", accent: "Support", description: "Reach us for booking help, payments, cancellations, or anything else.", image: "", ctaText: "", ctaLink: "" },
    { id: "c2", type: "links", items: [
      { label: "Phone", url: "tel:+918096000182", description: "+91 80960 00182" },
      { label: "WhatsApp", url: "https://wa.me/918096000183", description: "+91 80960 00183" },
      { label: "Email", url: "mailto:support@abhicabs.in", description: "support@abhicabs.in" },
    ]},
  ]},
  blogs: { sections: [
    { id: "b1", type: "hero", title: "Travel Tips,", accent: "Routes & Guides", description: "Outstation travel advice, route guides, and tips from the AbhiCabs team.", image: "", ctaText: "", ctaLink: "" },
  ]},
};

// ── Image uploader (reuses Cloudinary from blog editor) ──────────────────
function ImageUploader({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (file) => {
    if (!CL_CLOUD || !CL_PRESET) {
      alert("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", CL_PRESET);
      form.append("folder", "abhicabs_pages");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CL_CLOUD}/image/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (data.secure_url) onChange(data.secure_url);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</span>
      {value && (
        <div className="relative group rounded-xl overflow-hidden border border-[#E5E7EB]" style={{ maxHeight: 180 }}>
          <img src={value} alt="" className="w-full h-full object-cover" style={{ maxHeight: 180 }} />
          <button onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image">✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", color: "#374151", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#374151"; }}>
          {uploading ? <><Loader size={13} className="animate-spin" /> Uploading…</> : <><Upload size={13} /> {value ? "Replace" : "Upload Image"}</>}
        </button>
        {!value && (
          <input type="text" placeholder="Or paste image URL" className="wp-input flex-1 text-xs"
            onBlur={(e) => e.target.value && onChange(e.target.value.trim())} />
        )}
      </div>
    </div>
  );
}

// ── Section editor renderers ─────────────────────────────────────────────
function SectionEditor({ section, onChange, onRemove, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }) {
  const typeMeta = SECTION_TYPES.find((t) => t.type === section.type) || {};
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const set = (key, val) => onChange({ ...section, [key]: val });
  const isHidden = section._hidden === true;
  const setItem = (arr, idx, key, val) => {
    const items = [...(section[arr] || [])];
    items[idx] = { ...items[idx], [key]: val };
    onChange({ ...section, [arr]: items });
  };
  const addItem = (arr, template) => onChange({ ...section, [arr]: [...(section[arr] || []), template] });
  const removeItem = (arr, idx) => onChange({ ...section, [arr]: (section[arr] || []).filter((_, i) => i !== idx) });

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", overflow: "hidden", transition: "all 0.25s cubic-bezier(.4,0,.2,1)", animation: "cms-slide-up 0.3s ease-out" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "linear-gradient(135deg,#FAFAFA,#F3F4F6)", borderBottom: "1px solid #E5E7EB" }}>
        <span style={{ fontSize: 16, cursor: "grab", color: "#D1D5DB", transition: "color 0.15s" }} title="Drag to reorder"
          onMouseEnter={(e) => e.currentTarget.style.color = "#6B7280"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#D1D5DB"}>⠿</span>
        <span style={{ fontSize: 20, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #E5E7EB", flexShrink: 0 }}>{typeMeta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0a0a0a" }}>{typeMeta.label}</span>
          <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>{typeMeta.desc}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          {!isFirst && <button onClick={onMoveUp} className="w-7 h-7 rounded-lg hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280]" title="Move up"><ChevronUp size={14} /></button>}
          {!isLast && <button onClick={onMoveDown} className="w-7 h-7 rounded-lg hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280]" title="Move down"><ChevronDown size={14} /></button>}
          <button onClick={onRemove} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500" title="Remove section"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Section fields */}
      <div className="p-5 space-y-3">
        {section.type === "hero" && (<>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Title</span>
            <input value={section.title || ""} onChange={(e) => set("title", e.target.value)} className="wp-input" placeholder="Your Journey," /></label>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Accent (colored text)</span>
            <input value={section.accent || ""} onChange={(e) => set("accent", e.target.value)} className="wp-input" placeholder="Our Priority." /></label>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Description</span>
            <textarea rows={3} value={section.description || ""} onChange={(e) => set("description", e.target.value)} className="wp-input resize-y" /></label>
          <ImageUploader value={section.image} onChange={(url) => set("image", url)} label="Background Image" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">CTA Button Text</span>
              <input value={section.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} className="wp-input" placeholder="Get Started" /></label>
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">CTA Link</span>
              <input value={section.ctaLink || ""} onChange={(e) => set("ctaLink", e.target.value)} className="wp-input" placeholder="/#booking" /></label>
          </div>
        </>)}

        {section.type === "text" && (<>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Heading (optional)</span>
            <input value={section.heading || ""} onChange={(e) => set("heading", e.target.value)} className="wp-input" /></label>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Body</span>
            <textarea rows={5} value={section.body || ""} onChange={(e) => set("body", e.target.value)} className="wp-input resize-y" placeholder="Write your content here. HTML is supported." /></label>
        </>)}

        {section.type === "image" && (<>
          <ImageUploader value={section.url} onChange={(url) => set("url", url)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Alt Text (SEO)</span>
              <input value={section.alt || ""} onChange={(e) => set("alt", e.target.value)} className="wp-input" placeholder="Describe the image" /></label>
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Caption</span>
              <input value={section.caption || ""} onChange={(e) => set("caption", e.target.value)} className="wp-input" /></label>
          </div>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Width</span>
            <select value={section.width || "full"} onChange={(e) => set("width", e.target.value)} className="wp-input">
              <option value="full">Full width</option><option value="large">Large (800px)</option><option value="medium">Medium (600px)</option><option value="small">Small (400px)</option>
            </select></label>
        </>)}

        {section.type === "video" && (<>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Video URL (YouTube or Vimeo)</span>
            <input value={section.embedUrl || ""} onChange={(e) => set("embedUrl", e.target.value)} className="wp-input" placeholder="https://www.youtube.com/watch?v=..." /></label>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Caption</span>
            <input value={section.caption || ""} onChange={(e) => set("caption", e.target.value)} className="wp-input" /></label>
          {section.embedUrl && (() => {
            const src = getEmbedSrc(section.embedUrl);
            if (src) return <div className="rounded-xl overflow-hidden border border-[#E5E7EB]"><iframe src={src} className="w-full aspect-video" allowFullScreen /></div>;
            return <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] text-xs p-3">Not a recognized YouTube or Vimeo URL.</div>;
          })()}
        </>)}

        {section.type === "stats" && (<>
          <span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Stats</span>
          {(section.items || []).map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={item.value || ""} onChange={(e) => setItem("items", i, "value", e.target.value)} className="wp-input w-32" placeholder="10,000+" />
              <input value={item.label || ""} onChange={(e) => setItem("items", i, "label", e.target.value)} className="wp-input flex-1" placeholder="Rides completed" />
              <button onClick={() => removeItem("items", i)} className="w-7 h-7 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400"><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => addItem("items", { value: "", label: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add stat</button>
        </>)}

        {section.type === "features" && (<>
          <span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Features</span>
          {(section.items || []).map((item, i) => (
            <div key={i} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
              <div className="flex gap-2 items-center">
                <input value={item.icon || ""} onChange={(e) => setItem("items", i, "icon", e.target.value)} className="wp-input w-14 text-center text-lg" placeholder="✅" title="Emoji icon" />
                <input value={item.title || ""} onChange={(e) => setItem("items", i, "title", e.target.value)} className="wp-input flex-1" placeholder="Feature title" />
                <button onClick={() => removeItem("items", i)} className="w-7 h-7 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400"><Trash2 size={13} /></button>
              </div>
              <input value={item.description || ""} onChange={(e) => setItem("items", i, "description", e.target.value)} className="wp-input" placeholder="Short description" />
              <ImageUploader value={item.image} onChange={(url) => setItem("items", i, "image", url)} label="Feature Image (optional)" />
            </div>
          ))}
          <button onClick={() => addItem("items", { icon: "✅", title: "", description: "", image: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add feature</button>
        </>)}

        {section.type === "cta" && (<>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Heading</span>
            <input value={section.heading || ""} onChange={(e) => set("heading", e.target.value)} className="wp-input" /></label>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Description</span>
            <textarea rows={2} value={section.description || ""} onChange={(e) => set("description", e.target.value)} className="wp-input resize-y" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Button Text</span>
              <input value={section.buttonText || ""} onChange={(e) => set("buttonText", e.target.value)} className="wp-input" /></label>
            <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Button Link</span>
              <input value={section.buttonLink || ""} onChange={(e) => set("buttonLink", e.target.value)} className="wp-input" /></label>
          </div>
          <label className="block"><span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Style</span>
            <select value={section.style || "primary"} onChange={(e) => set("style", e.target.value)} className="wp-input">
              <option value="primary">Primary (dark bg, white text)</option><option value="secondary">Secondary (light bg)</option><option value="outline">Outline</option>
            </select></label>
        </>)}

        {section.type === "faq" && (<>
          <span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Questions &amp; Answers</span>
          {(section.items || []).map((item, i) => (
            <div key={i} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
              <div className="flex gap-2 items-center">
                <input value={item.question || ""} onChange={(e) => setItem("items", i, "question", e.target.value)} className="wp-input flex-1 font-semibold" placeholder="Question" />
                <button onClick={() => removeItem("items", i)} className="w-7 h-7 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400"><Trash2 size={13} /></button>
              </div>
              <textarea rows={2} value={item.answer || ""} onChange={(e) => setItem("items", i, "answer", e.target.value)} className="wp-input resize-y" placeholder="Answer" />
            </div>
          ))}
          <button onClick={() => addItem("items", { question: "", answer: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add FAQ</button>
        </>)}

        {section.type === "gallery" && (<>
          <span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Images</span>
          <div className="grid grid-cols-2 gap-3">
            {(section.images || []).map((img, i) => (
              <div key={i} className="space-y-1.5 p-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                <ImageUploader value={img.url} onChange={(url) => { const imgs = [...(section.images || [])]; imgs[i] = { ...imgs[i], url }; onChange({ ...section, images: imgs }); }} label={`Image ${i + 1}`} />
                <input value={img.alt || ""} placeholder="Alt text" className="wp-input text-xs"
                  onChange={(e) => { const imgs = [...(section.images || [])]; imgs[i] = { ...imgs[i], alt: e.target.value }; onChange({ ...section, images: imgs }); }} />
                <button onClick={() => onChange({ ...section, images: (section.images || []).filter((_, j) => j !== i) })}
                  className="text-[11px] text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
          <button onClick={() => onChange({ ...section, images: [...(section.images || []), { url: "", alt: "", caption: "" }] })}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add image</button>
        </>)}

        {section.type === "links" && (<>
          <span className="block mb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Links</span>
          {(section.items || []).map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <input value={item.label || ""} onChange={(e) => setItem("items", i, "label", e.target.value)} className="wp-input font-semibold" placeholder="Label (e.g. Phone)" />
                <input value={item.url || ""} onChange={(e) => setItem("items", i, "url", e.target.value)} className="wp-input text-xs" placeholder="URL (tel:, mailto:, https://)" />
                <input value={item.description || ""} onChange={(e) => setItem("items", i, "description", e.target.value)} className="wp-input text-xs" placeholder="Display text" />
              </div>
              <button onClick={() => removeItem("items", i)} className="w-7 h-7 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 mt-1"><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => addItem("items", { label: "", url: "", description: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add link</button>
        </>)}

        {section.type === "divider" && (
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Style</span>
            <select value={section.style || "line"} onChange={(e) => set("style", e.target.value)} className="wp-input" style={{ width: 160 }}>
              <option value="line">Line</option><option value="dots">Dots</option><option value="space">Whitespace</option><option value="gradient">Gradient</option>
            </select>
          </div>
        )}

        {section.type === "testimonial" && (<>
          <span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Testimonials</span>
          {(section.items || []).map((item, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#FAFAFA", marginBottom: 8 }} className="space-y-2">
              <textarea rows={2} value={item.quote || ""} onChange={(e) => setItem("items", i, "quote", e.target.value)} className="wp-input resize-y" placeholder="What the customer said…" style={{ fontStyle: "italic" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={item.name || ""} onChange={(e) => setItem("items", i, "name", e.target.value)} className="wp-input" placeholder="Customer name" style={{ flex: 1 }} />
                <input value={item.role || ""} onChange={(e) => setItem("items", i, "role", e.target.value)} className="wp-input" placeholder="Role / City" style={{ flex: 1 }} />
              </div>
              <ImageUploader value={item.image} onChange={(url) => setItem("items", i, "image", url)} label="Photo (optional)" />
              <button onClick={() => removeItem("items", i)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>
            </div>
          ))}
          <button onClick={() => addItem("items", { quote: "", name: "", role: "", image: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add testimonial</button>
        </>)}

        {section.type === "team" && (<>
          <span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Team Members</span>
          <div className="grid grid-cols-2 gap-3">
            {(section.items || []).map((item, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#FAFAFA" }} className="space-y-2">
                <ImageUploader value={item.image} onChange={(url) => setItem("items", i, "image", url)} label="Photo" />
                <input value={item.name || ""} onChange={(e) => setItem("items", i, "name", e.target.value)} className="wp-input" placeholder="Full name" />
                <input value={item.role || ""} onChange={(e) => setItem("items", i, "role", e.target.value)} className="wp-input" placeholder="Role / Title" />
                <textarea rows={2} value={item.bio || ""} onChange={(e) => setItem("items", i, "bio", e.target.value)} className="wp-input resize-y" placeholder="Short bio" />
                <button onClick={() => removeItem("items", i)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>
              </div>
            ))}
          </div>
          <button onClick={() => addItem("items", { name: "", role: "", bio: "", image: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857] mt-2"><Plus size={13} /> Add member</button>
        </>)}

        {section.type === "banner" && (<>
          <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Banner Text</span>
            <textarea rows={2} value={section.text || ""} onChange={(e) => set("text", e.target.value)} className="wp-input resize-y" placeholder="Announcement or promo text" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Style</span>
              <select value={section.style || "info"} onChange={(e) => set("style", e.target.value)} className="wp-input">
                <option value="info">Info (Blue)</option><option value="success">Success (Green)</option><option value="warning">Warning (Amber)</option><option value="error">Error (Red)</option><option value="promo">Promo (Gold)</option>
              </select></label>
            <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Link Text</span>
              <input value={section.linkText || ""} onChange={(e) => set("linkText", e.target.value)} className="wp-input" placeholder="Learn more" /></label>
            <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Link URL</span>
              <input value={section.linkUrl || ""} onChange={(e) => set("linkUrl", e.target.value)} className="wp-input" placeholder="/page" /></label>
          </div>
        </>)}

        {section.type === "accordion" && (<>
          <span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accordion Panels</span>
          {(section.items || []).map((item, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#FAFAFA", marginBottom: 8 }} className="space-y-2">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={item.title || ""} onChange={(e) => setItem("items", i, "title", e.target.value)} className="wp-input" placeholder="Panel title" style={{ flex: 1, fontWeight: 700 }} />
                <button onClick={() => removeItem("items", i)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "#D1D5DB" }}><Trash2 size={13} /></button>
              </div>
              <textarea rows={3} value={item.content || ""} onChange={(e) => setItem("items", i, "content", e.target.value)} className="wp-input resize-y" placeholder="Panel content (HTML supported)" />
            </div>
          ))}
          <button onClick={() => addItem("items", { title: "", content: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add panel</button>
        </>)}

        {section.type === "embed" && (<>
          <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>HTML / Embed Code</span>
            <textarea rows={6} value={section.code || ""} onChange={(e) => set("code", e.target.value)} className="wp-input resize-y" placeholder="<iframe src=&quot;...&quot;></iframe> or any HTML" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }} /></label>
          <label className="block"><span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Caption</span>
            <input value={section.caption || ""} onChange={(e) => set("caption", e.target.value)} className="wp-input" placeholder="Optional description" /></label>
          {section.code && <div style={{ padding: 12, background: "#F3F4F6", borderRadius: 12, fontSize: 11, color: "#6B7280" }}>Preview not available for security — embed will render on the live page.</div>}
        </>)}

        {section.type === "social" && (<>
          <span style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Social Links</span>
          {(section.items || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <select value={item.platform || "Instagram"} onChange={(e) => setItem("items", i, "platform", e.target.value)} className="wp-input" style={{ width: 130 }}>
                {["Instagram","Facebook","Twitter","LinkedIn","YouTube","WhatsApp","Telegram","Pinterest","TikTok","GitHub","Website"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={item.url || ""} onChange={(e) => setItem("items", i, "url", e.target.value)} className="wp-input" placeholder="https://..." style={{ flex: 1 }} />
              <button onClick={() => removeItem("items", i)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "#D1D5DB" }}><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => addItem("items", { platform: "Instagram", url: "" })} className="flex items-center gap-1 text-[12px] font-semibold text-[#059669] hover:text-[#047857]"><Plus size={13} /> Add link</button>
        </>)}
      </div>
    </div>
  );
}


// ── Live Preview Renderer — shows sections as they appear on the website ──
function SectionPreview({ section, idx, onEdit, isEditing }) {
  if (section._hidden) return null;
  const bg = section._bgColor || "";
  const clr = section._textColor || "";
  const pad = { none: "0", small: "20px 0", normal: "40px 0", large: "64px 0", xl: "88px 0" }[section._padding] || "40px 0";

  const wrapper = (children) => (
    <div
      onClick={() => onEdit(idx)}
      style={{ background: bg || undefined, color: clr || undefined, padding: pad, cursor: "pointer", position: "relative", transition: "all 0.2s", borderRadius: 12, border: isEditing ? "2px solid #F5A623" : "2px solid transparent", marginBottom: 4 }}
      onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.border = "2px dashed #D1D5DB"; }}
      onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.border = "2px solid transparent"; }}
      title="Click to edit this section"
    >
      {/* Edit badge */}
      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, background: isEditing ? "#F5A623" : "rgba(0,0,0,0.5)", color: "#fff", padding: "3px 10px", borderRadius: 20, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em", pointerEvents: "none" }}>
        {isEditing ? "Editing" : section.type}
      </div>
      {children}
    </div>
  );

  switch (section.type) {
    case "hero":
      return wrapper(
        <div style={{ background: section.image ? `linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.7)),url(${section.image}) center/cover` : "linear-gradient(135deg,#1B1B1B,#0a0a0a)", borderRadius: 16, padding: "48px 36px", textAlign: "center" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>{section.title || "Page Title"}</h1>
          {section.accent && <h1 style={{ fontSize: 36, fontWeight: 900, color: "#F5A623", margin: "4px 0 0", letterSpacing: "-0.03em" }}>{section.accent}</h1>}
          {section.description && <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginTop: 16, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>{section.description}</p>}
          {section.ctaText && <button style={{ marginTop: 20, padding: "12px 28px", background: "linear-gradient(135deg,#F5A623,#E09000)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14 }}>{section.ctaText}</button>}
        </div>
      );

    case "text":
      return wrapper(
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          {section.heading && <h2 style={{ fontSize: 24, fontWeight: 800, color: clr || "#0a0a0a", marginBottom: 12, letterSpacing: "-0.02em" }}>{section.heading}</h2>}
          <p style={{ fontSize: 15, lineHeight: 1.8, color: clr || "#374151" }}>{section.body || "Text content goes here..."}</p>
        </div>
      );

    case "image":
      return wrapper(
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          {section.url ? <img src={section.url} alt={section.alt || ""} style={{ maxWidth: section.width === "small" ? 400 : section.width === "medium" ? 600 : section.width === "large" ? 800 : "100%", borderRadius: 16, margin: "0 auto", display: "block", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
            : <div style={{ height: 200, background: "#F3F4F6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 14, fontWeight: 600 }}>No image uploaded</div>}
          {section.caption && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, fontStyle: "italic" }}>{section.caption}</p>}
        </div>
      );

    case "video":
      const videoSrc = getEmbedSrc(section.embedUrl);
      return wrapper(
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          {videoSrc ? <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}><iframe src={videoSrc} style={{ width: "100%", aspectRatio: "16/9", border: "none" }} allowFullScreen /></div>
            : <div style={{ height: 180, background: "#F3F4F6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 14 }}>Paste a YouTube or Vimeo URL</div>}
          {section.caption && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>{section.caption}</p>}
        </div>
      );

    case "stats":
      return wrapper(
        <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", padding: "0 24px" }}>
          {(section.items || []).map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: clr || "#F5A623", letterSpacing: "-0.03em" }}>{s.value || "0"}</div>
              <div style={{ fontSize: 13, color: clr ? `${clr}99` : "#6B7280", fontWeight: 600, marginTop: 4 }}>{s.label || "Label"}</div>
            </div>
          ))}
        </div>
      );

    case "features":
      return wrapper(
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, padding: "0 24px" }}>
          {(section.items || []).map((f, i) => (
            <div key={i} style={{ background: bg ? "rgba(255,255,255,0.08)" : "#fff", border: bg ? "none" : "1px solid #E5E7EB", borderRadius: 16, padding: 20, textAlign: "center" }}>
              {f.image && <img src={f.image} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", margin: "0 auto 10px" }} />}
              <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><EmojiIcon glyph={f.icon || "✅"} size={30} color="#F5A623" /></div>
              <div style={{ fontSize: 15, fontWeight: 800, color: clr || "#0a0a0a" }}>{f.title || "Feature"}</div>
              {f.description && <div style={{ fontSize: 13, color: clr ? `${clr}99` : "#6B7280", marginTop: 4, lineHeight: 1.5 }}>{f.description}</div>}
            </div>
          ))}
        </div>
      );

    case "cta":
      const ctaBg = { primary: "linear-gradient(135deg,#1B1B1B,#0a0a0a)", secondary: "#F3F4F6", outline: "#fff" }[section.style] || "linear-gradient(135deg,#1B1B1B,#0a0a0a)";
      const ctaClr = section.style === "primary" ? "#fff" : "#0a0a0a";
      return wrapper(
        <div style={{ background: ctaBg, borderRadius: 20, padding: "40px 32px", textAlign: "center", border: section.style === "outline" ? "2px solid #E5E7EB" : "none" }}>
          {section.heading && <h3 style={{ fontSize: 24, fontWeight: 900, color: ctaClr, margin: 0 }}>{section.heading}</h3>}
          {section.description && <p style={{ fontSize: 14, color: `${ctaClr}aa`, marginTop: 8, maxWidth: 480, margin: "8px auto 0" }}>{section.description}</p>}
          {section.buttonText && <button style={{ marginTop: 20, padding: "12px 28px", background: section.style === "primary" ? "linear-gradient(135deg,#F5A623,#E09000)" : "#1B1B1B", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14 }}>{section.buttonText}</button>}
        </div>
      );

    case "faq":
      return wrapper(
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
          {(section.items || []).map((q, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E5E7EB", padding: "16px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: clr || "#0a0a0a" }}>{q.question || "Question?"}</div>
              <div style={{ fontSize: 14, color: clr ? `${clr}99` : "#6B7280", marginTop: 6, lineHeight: 1.6 }}>{q.answer || "Answer..."}</div>
            </div>
          ))}
        </div>
      );

    case "gallery":
      return wrapper(
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, padding: "0 24px" }}>
          {(section.images || []).map((img, i) => (
            <div key={i}>
              {img.url ? <img src={img.url} alt={img.alt || ""} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12, display: "block" }} />
                : <div style={{ aspectRatio: "4/3", background: "#F3F4F6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#D1D5DB", fontSize: 24 }}>📷</div>}
            </div>
          ))}
        </div>
      );

    case "links":
      return wrapper(
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", padding: "0 24px" }}>
          {(section.items || []).map((lnk, i) => (
            <div key={i} style={{ background: bg ? "rgba(255,255,255,0.08)" : "#fff", border: bg ? "none" : "1px solid #E5E7EB", borderRadius: 14, padding: "14px 20px", minWidth: 180 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lnk.label || "Link"}</div>
              <div style={{ fontSize: 14, color: clr || "#374151", marginTop: 3 }}>{lnk.description || lnk.url || "—"}</div>
            </div>
          ))}
        </div>
      );

    case "testimonial":
      return wrapper(
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, padding: "0 24px" }}>
          {(section.items || []).map((t, i) => (
            <div key={i} style={{ background: bg ? "rgba(255,255,255,0.06)" : "#fff", border: bg ? "none" : "1px solid #E5E7EB", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 15, fontStyle: "italic", color: clr || "#374151", lineHeight: 1.7, marginBottom: 14 }}>"{t.quote || "Customer quote..."}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {t.image ? <img src={t.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}><EmojiIcon glyph="👤" size={18} color="#9CA3AF" /></div>}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: clr || "#0a0a0a" }}>{t.name || "Name"}</div>
                  {t.role && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.role}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case "team":
      return wrapper(
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, padding: "0 24px" }}>
          {(section.items || []).map((m, i) => (
            <div key={i} style={{ textAlign: "center", background: bg ? "rgba(255,255,255,0.06)" : "#fff", border: bg ? "none" : "1px solid #E5E7EB", borderRadius: 16, padding: 20 }}>
              {m.image ? <img src={m.image} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px" }} /> : <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F3F4F6", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}><EmojiIcon glyph="👤" size={30} color="#9CA3AF" /></div>}
              <div style={{ fontSize: 15, fontWeight: 800, color: clr || "#0a0a0a" }}>{m.name || "Name"}</div>
              {m.role && <div style={{ fontSize: 12, color: "#F5A623", fontWeight: 600, marginTop: 2 }}>{m.role}</div>}
              {m.bio && <div style={{ fontSize: 12, color: clr ? `${clr}99` : "#6B7280", marginTop: 6, lineHeight: 1.5 }}>{m.bio}</div>}
            </div>
          ))}
        </div>
      );

    case "banner":
      const bannerColors = { info: "#EFF6FF", success: "#ECFDF5", warning: "#FFFBEB", error: "#FEF2F2", promo: "linear-gradient(135deg,#FFFBEB,#FEF3C7)" };
      const bannerText = { info: "#1E40AF", success: "#065F46", warning: "#92400E", error: "#991B1B", promo: "#92400E" };
      return wrapper(
        <div style={{ background: bannerColors[section.style] || bannerColors.info, padding: "16px 24px", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: bannerText[section.style] || bannerText.info }}>{section.text || "Banner text..."}</span>
          {section.linkText && <span style={{ fontSize: 13, fontWeight: 700, color: "#F5A623" }}>{section.linkText} →</span>}
        </div>
      );

    case "divider":
      return wrapper(
        <div style={{ padding: "8px 24px" }}>
          {section.style === "dots" ? <div style={{ textAlign: "center", color: "#D1D5DB", letterSpacing: 8 }}>• • •</div>
            : section.style === "gradient" ? <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#F5A623,transparent)", borderRadius: 2 }} />
            : section.style === "space" ? <div style={{ height: 40 }} />
            : <div style={{ height: 1, background: "#E5E7EB" }} />}
        </div>
      );

    default:
      return wrapper(
        <div style={{ padding: "20px 24px", background: "#F9FAFB", borderRadius: 12, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          {section.type} section
        </div>
      );
  }
}

// ── Main PageEditor component ────────────────────────────────────────────
function PageEditor({ onBack }) {
  const { user, logout, token, canEdit } = useAuth();
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // "preview" | "edit"
  const [editingIdx, setEditingIdx] = useState(null);
  const [livePreviewKey, setLivePreviewKey] = useState(0); // bump to reload the live page frame
  const [serviceModal, setServiceModal] = useState({ open: false, name: "", mode: "one-way", group: "", cities: "", kind: "custom", vehicle: "Tempo Traveller" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: "" });

  // The real public URL for the active page — home "/", main pages "/<id>",
  // service pages "/services/<slug>". Used to show the COMPLETE live page
  // (header, booking widget, fleet, footer — everything) in the preview frame.
  const livePageUrl = !activePage
    ? "/"
    : activePage === "home"
    ? "/"
    : (pages[activePage]?._service || pages[activePage]?._custom)
    ? `/services/${activePage}`
    : `/${activePage}`;

  const API = API_ROOT;

  // ── Auto-save service pages to localStorage every 30 seconds ──
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const key = "draft_service_pages";
    // Auto-save timer
    const timer = setInterval(() => {
      if (Object.keys(pages).length > 0) {
        localStorage.setItem(key, JSON.stringify({ pages, savedAt: new Date().toISOString() }));
      }
    }, 30000);
    // Save on tab close
    const handleUnload = () => {
      if (Object.keys(pages).length > 0) {
        localStorage.setItem(key, JSON.stringify({ pages, savedAt: new Date().toISOString() }));
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => { clearInterval(timer); window.removeEventListener("beforeunload", handleUnload); };
  }, [pages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/blog/pages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        const saved = json?.data || {};
        const merged = {};
        PAGE_DEFS.forEach((p) => {
          merged[p.id] = saved[p.id] && saved[p.id].sections
            ? saved[p.id]
            : DEFAULT_PAGE_CONTENT[p.id] || { sections: [] };
        });
        setPages(merged);
      } catch {
        // API failed — try recovering from local draft
        if (typeof localStorage !== "undefined") {
          try {
            const draft = localStorage.getItem("draft_service_pages");
            if (draft) {
              const parsed = JSON.parse(draft);
              if (parsed.pages && Object.keys(parsed.pages).length > 0) {
                setPages(parsed.pages);
                const ago = parsed.savedAt ? new Date(parsed.savedAt).toLocaleString() : "unknown";
                console.info(`[CMS] Recovered service pages from local draft (saved ${ago})`);
              } else {
                setPages({ ...DEFAULT_PAGE_CONTENT });
              }
            } else {
              setPages({ ...DEFAULT_PAGE_CONTENT });
            }
          } catch { setPages({ ...DEFAULT_PAGE_CONTENT }); }
        } else {
          setPages({ ...DEFAULT_PAGE_CONTENT });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Main pages (PAGE_DEFS) are edit-only — they can't be created or deleted.
  // Service pages are the only creatable/deletable kind; they go live at
  // /services/<slug>.
  const MAIN_PAGE_IDS = PAGE_DEFS.map((p) => p.id);

  // ── Home layout (reorder / show-hide built-in sections) ──────────────────
  const normalizeHomeLayout = () => {
    const saved = Array.isArray(pages.home?._layout) ? pages.home._layout : null;
    const known = new Set(HOME_LAYOUT_ORDER);
    if (!saved) return HOME_LAYOUT_ORDER.map((key) => ({ key, hidden: false }));
    const out = saved.filter((e) => e && known.has(e.key)).map((e) => ({ key: e.key, hidden: !!e.hidden }));
    const seen = new Set(out.map((e) => e.key));
    for (const key of HOME_LAYOUT_ORDER) if (!seen.has(key)) out.push({ key, hidden: false });
    return out;
  };
  const setHomeLayout = (next) =>
    setPages((prev) => ({ ...prev, home: { ...(prev.home || {}), _layout: next } }));
  const toggleHomeSection = (key) =>
    setHomeLayout(normalizeHomeLayout().map((e) => (e.key === key ? { ...e, hidden: !e.hidden } : e)));
  const moveHomeSection = (key, dir) => {
    const list = normalizeHomeLayout();
    const i = list.findIndex((e) => e.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setHomeLayout(list);
  };

  // Every new service page starts from this template — a ready-made layout the
  // editor just fills with content (hero → intro → features → FAQ → CTA), then
  // Save → live at /services/<slug>. Sections use the standard builder types so
  // they stay fully editable and render via SectionRenderer.
  const serviceTemplateSections = (label) => {
    const t = Date.now();
    const lower = label.toLowerCase();
    return [
      { id: `s${t}a`, type: "hero", title: label, accent: "", description: `Book ${lower} with AbhiCabs — transparent fares, verified drivers and 24×7 support across Karnataka, Telangana, Andhra Pradesh and Maharashtra.`, image: "", ctaText: "Get Instant Quote", ctaLink: "/#booking" },
      { id: `s${t}b`, type: "text", heading: `About our ${label}`, body: `Describe your ${lower} here — what it covers, who it's for, and why travellers choose AbhiCabs. Replace this placeholder with the real details.` },
      { id: `s${t}c`, type: "features", items: [
        { icon: "✅", title: "Verified Drivers", description: "KYC-verified, background-checked chauffeurs." },
        { icon: "💰", title: "Transparent Pricing", description: "See the exact fare before you book." },
        { icon: "🚗", title: "Clean, Comfortable Cars", description: "A well-maintained fleet for every trip." },
        { icon: "📞", title: "24×7 Support", description: "Real people, whenever you need them." },
      ] },
      { id: `s${t}d`, type: "faq", items: [
        { question: `How do I book ${lower}?`, answer: "Enter your trip details, get an instant quote, and confirm — it takes under a minute." },
        { question: "What vehicles are available?", answer: "Sedans, SUVs and larger vehicles for groups, in both AC and non-AC." },
        { question: "Is the pricing transparent?", answer: "Yes — you see the full fare before booking, with no hidden charges." },
      ] },
      { id: `s${t}e`, type: "cta", heading: "Ready to ride?", description: "Book your cab in under a minute.", buttonText: "Get Instant Quote", buttonLink: "/#booking", style: "primary" },
    ];
  };

  const slugify = (s) => (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const openServiceModal = () => { if (canEdit) setServiceModal({ open: true, name: "", mode: "one-way", group: "", cities: "", kind: "custom", vehicle: "Tempo Traveller" }); };
  // Plan what the popup will create: [{ label, slug, bad, vars }]
  //  - a page type (preset): one page per city / route line, content generated from the preset
  //  - custom: one page, or one per city using the name pattern
  const planServicePages = (m) => {
    const preset = SERVICE_PRESETS.find((p) => p.id === m.kind);
    let entries;
    if (preset) entries = parsePresetList(preset, m.cities).map((vars) => ({ vars, label: presetLabel(preset, vars, m.vehicle) }));
    else {
      const cityList = m.cities.split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
      entries = namesForCities(m.name, cityList).map((label) => ({ vars: {}, label }));
    }
    const seen = new Set();
    return entries.map(({ vars, label }) => {
      const slug = slugifyName(label);
      const bad = !slug || MAIN_PAGE_IDS.includes(slug) || !!pages[slug] || seen.has(slug);
      seen.add(slug);
      return { label, slug, bad, vars };
    });
  };
  const submitServicePage = () => {
    if (!canEdit) return;
    const plan = planServicePages(serviceModal);
    if (!plan.length || plan.some((x) => x.bad)) return; // guarded by the modal's disabled state
    const preset = SERVICE_PRESETS.find((p) => p.id === serviceModal.kind);
    const group = serviceModal.group.trim();
    setPages((prev) => {
      const next = { ...prev };
      plan.forEach(({ label, slug, vars }) => {
        // Dynamic template: content + layout stored (rendered by ServiceLanding). Full section builder via Layout Manager.
        const content = preset ? preset.build({ ...vars, vehicle: serviceModal.vehicle }, label) : newServiceContent(label, serviceModal.mode, group);
        if (group) content.group = group;
        next[slug] = { _slug: slug, _label: label, _icon: "🧳", _desc: "Service page", _custom: true, _service: true, _template: "service", _content: content, sections: [] };
      });
      return next;
    });
    setActivePage(plan[0].slug);
    setServiceModal({ open: false, name: "", mode: "one-way", group: "", cities: "", kind: "custom", vehicle: "Tempo Traveller" });
  };

  // Built-in services run on code defaults until "customised": this copies the defaults into an editable CMS page.
  const customizeBuiltIn = (slug) => {
    if (!canEdit || pages[slug]) { setActivePage(slug); return; }
    const label = SERVICE_LINKS.find((l) => l.href === `/services/${slug}`)?.short || slug;
    setPages((prev) => ({ ...prev, [slug]: { _slug: slug, _label: label, _icon: "🧳", _desc: "Service page", _custom: true, _service: true, _template: "service", _content: cfgToContent(slug), sections: [] } }));
    setActivePage(slug);
  };

  const requestDeleteServicePage = (id) => {
    if (!canEdit) return;
    const pg = pages[id];
    if (!pg || MAIN_PAGE_IDS.includes(id) || (!pg._service && !pg._custom)) return; // never delete main pages
    setDeleteModal({ open: true, id, label: pg._label || id });
  };
  const confirmDeleteServicePage = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null, label: "" });
    if (!id || !canEdit) return;
    const next = { ...pages };
    delete next[id];
    setPages(next);
    if (activePage === id) setActivePage(null);
    try {
      await fetch(`${API}/api/v1/blog/pages`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch { /* kept out of state regardless; next save will reconcile */ }
  };

  const servicePages = Object.entries(pages)
    .filter(([, pg]) => pg._custom || pg._service)
    .map(([id, pg]) => ({ id, label: pg._label || id, icon: pg._icon || "🧳", desc: pg._desc || "Service page" }));

  const renderPageBtn = (p) => {
    const active = activePage === p.id;
    return (
      <button key={p.id} onClick={() => { setActivePage(p.id); setAddingSection(false); }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] rounded-lg transition-all"
        style={active ? { background: "linear-gradient(90deg,rgba(245,166,35,0.12),rgba(245,166,35,0.04))", color: "#fff", fontWeight: 700, boxShadow: "inset 3px 0 0 #F5A623", borderRadius: 10 } : { color: "#6B7280", borderRadius: 10, transition: "all 0.2s" }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateX(2px)"; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; } }}>
        <EmojiIcon glyph={p.icon} size={15} /> {p.label}
      </button>
    );
  };

  const PAGE_CARD_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#EC4899"];
  const renderPageCard = (p, i, deletable) => {
    const sectionCount = (pages[p.id]?.sections || []).length;
    const clr = PAGE_CARD_COLORS[i % PAGE_CARD_COLORS.length];
    return (
      <div key={p.id} style={{ position: "relative" }}>
        <button onClick={() => setActivePage(p.id)}
          className="group text-left relative overflow-hidden w-full"
          style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", padding: 0, cursor: "pointer", transition: "all 0.3s cubic-bezier(.4,0,.2,1)", animation: `cms-slide-up 0.4s ease-out ${i * 0.06}s both` }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${clr}15, 0 4px 12px rgba(0,0,0,0.06)`; e.currentTarget.style.borderColor = `${clr}40`; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${clr},${clr}88)`, borderRadius: "20px 20px 0 0" }} />
          <div style={{ padding: "20px 20px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `${clr}10`, flexShrink: 0, transition: "all 0.25s" }} className="group-hover:scale-110"><EmojiIcon glyph={p.icon} size={22} color={clr} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0a0a0a", letterSpacing: "-0.01em" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: clr, display: "flex", alignItems: "center", gap: 4, transition: "gap 0.2s" }} className="group-hover:gap-2">Edit <ArrowLeft size={12} style={{ rotate: "180deg" }} /></span>
            </div>
          </div>
        </button>
        {deletable && canEdit && (
          <div role="button" title="Delete service page" aria-label="Delete service page"
            onClick={(e) => { e.stopPropagation(); requestDeleteServicePage(p.id); }}
            style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 9, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3 }}>
            <Trash2 size={14} />
          </div>
        )}
      </div>
    );
  };

  const updateSection = (pageId, sectionIdx, updated) => {
    setPages((prev) => {
      const sections = [...(prev[pageId]?.sections || [])];
      sections[sectionIdx] = updated;
      return { ...prev, [pageId]: { ...prev[pageId], sections } };
    });
  };

  const removeSection = (pageId, sectionIdx) => {
    if (!confirm("Remove this section?")) return;
    setPages((prev) => {
      const sections = (prev[pageId]?.sections || []).filter((_, i) => i !== sectionIdx);
      return { ...prev, [pageId]: { ...prev[pageId], sections } };
    });
  };

  const moveSection = (pageId, from, to) => {
    setPages((prev) => {
      const sections = [...(prev[pageId]?.sections || [])];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { ...prev, [pageId]: { ...prev[pageId], sections } };
    });
  };

  const addSection = (pageId, type) => {
    setPages((prev) => {
      const sections = [...(prev[pageId]?.sections || []), { id: `s${Date.now()}`, type, ...sectionDefaults(type) }];
      return { ...prev, [pageId]: { ...prev[pageId], sections } };
    });
    setAddingSection(false);
  };

  const duplicateSection = (pageId, sectionIdx) => {
    setPages((prev) => {
      const sections = [...(prev[pageId]?.sections || [])];
      const original = sections[sectionIdx];
      const clone = { ...JSON.parse(JSON.stringify(original)), id: `s${Date.now()}` };
      sections.splice(sectionIdx + 1, 0, clone);
      return { ...prev, [pageId]: { ...prev[pageId], sections } };
    });
  };

  const savePage = async (pageId) => {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/blog/pages`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(pages),
      });
      const json = await res.json().catch(() => ({}));
      setSaveMsg(res.ok ? { type: "ok", text: "Saved!" } : { type: "err", text: json.message || "Save failed" });
    } catch (e) {
      setSaveMsg({ type: "err", text: e.message || "Could not reach server" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FAFB" }}><Loader size={24} className="animate-spin text-[#1B1B1B]" /></div>;

  const currentSections = activePage ? (pages[activePage]?.sections || []) : [];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Urbanist', sans-serif", background: "#F9FAFB" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── New service page modal (replaces the native prompt) ── */}
      {serviceModal.open && (() => {
        const plan = planServicePages(serviceModal);
        const preset = SERVICE_PRESETS.find((p) => p.id === serviceModal.kind);
        const badOnes = plan.filter((x) => x.bad);
        const valid = plan.length > 0 && badOnes.length === 0;
        const reset = { open: false, name: "", mode: "one-way", group: "", cities: "", kind: "custom", vehicle: "Tempo Traveller" };
        const close = () => setServiceModal(reset);
        const lbl = { display: "block", fontSize: 11.5, fontWeight: 800, color: "#6B7280", margin: "14px 0 5px", textTransform: "uppercase" };
        const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #D1D5DB", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#fff" };
        const existingGroups = [...new Set(Object.values(pages).map((p) => p?._content?.group).filter(Boolean))];
        const pickKind = (id) => { const pr = SERVICE_PRESETS.find((p) => p.id === id); setServiceModal((m) => ({ ...m, kind: id, group: pr ? pr.group : m.group, cities: "" })); };
        const listLabel = !preset ? "Create for several cities (optional — one per line or comma-separated)" : preset.input === "route" ? "Routes — one per line, like “Bangalore to Mysore”" : preset.input === "state" ? "States — Karnataka, Andhra Pradesh, Telangana, Maharashtra" : "Cities — one per line or comma-separated";
        const listPlaceholder = preset?.input === "route" ? "Bangalore to Mysore\nBangalore to Coorg" : preset?.input === "state" ? "Karnataka\nTelangana" : "Bangalore\nHyderabad";
        return (
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", padding: 22, animation: "cms-slide-up 0.2s ease-out both" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111" }}>New service page</div>
              <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>Pages are fully customizable — add, remove, and reorder any section. Pick a type to start with ready-made content, or choose Custom to build from scratch.</div>

              <label style={lbl}>Page type</label>
              <select value={serviceModal.kind} onChange={(e) => pickKind(e.target.value)} style={inp}>
                <option value="custom">Custom page (blank content)</option>
                {SERVICE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              {preset && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 5 }}>{preset.hint}</div>}

              {!preset && (<>
                <label style={lbl}>{serviceModal.cities.trim() ? "Page name pattern" : "Page name"}</label>
                <input autoFocus value={serviceModal.name} onChange={(e) => setServiceModal((m) => ({ ...m, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" && valid) submitServicePage(); if (e.key === "Escape") close(); }}
                  placeholder={serviceModal.cities.trim() ? "e.g. Car rental in {city}" : "e.g. Wedding Car Rental"} style={{ ...inp, borderColor: badOnes.length ? "#DC2626" : "#D1D5DB" }} />
              </>)}

              {preset?.vehicle && (<>
                <label style={lbl}>Vehicle</label>
                <input list="svc-vehicles" value={serviceModal.vehicle} onChange={(e) => setServiceModal((m) => ({ ...m, vehicle: e.target.value }))} style={inp} />
                <datalist id="svc-vehicles">{VEHICLE_SUGGESTIONS.map((v) => <option key={v} value={v} />)}</datalist>
              </>)}

              <label style={lbl}>{listLabel}</label>
              <textarea rows={preset ? 4 : 3} value={serviceModal.cities} onChange={(e) => setServiceModal((m) => ({ ...m, cities: e.target.value }))} placeholder={listPlaceholder} style={{ ...inp, resize: "vertical" }} />
              {preset && <div style={{ fontSize: 11.5, color: "#B45309", marginTop: 5 }}>Only add places you actually serve — each page promises the booking form works there.</div>}
              {preset?.id === "route" && (() => {
                const req = plan.filter((x) => classifyOrigin(x.vars.from) === "request").length;
                const unk = plan.filter((x) => classifyOrigin(x.vars.from) === "unknown").length;
                return (req || unk) ? (
                  <div style={{ fontSize: 11.5, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "7px 10px", marginTop: 6, lineHeight: 1.55 }}>
                    {req > 0 && <>{req} route{req > 1 ? "s start" : " starts"} outside Karnataka, Andhra Pradesh, Telangana and Maharashtra, so {req > 1 ? "those pages say" : "that page says"} “request — confirmed after review”, never “confirmed”. </>}
                    {unk > 0 && <>{unk} start{unk > 1 ? "" : "s"} in a place I don't recognise — check which state it is in; it is treated as a normal booking page until you do.</>}
                  </div>
                ) : <div style={{ fontSize: 11.5, color: "#047857", marginTop: 6 }}>All of these routes start in a state we operate in — normal availability check.</div>;
              })()}

              <label style={lbl}>Directory group <span style={{ fontWeight: 600, textTransform: "none", color: "#9CA3AF" }}>(optional)</span></label>
              <input list="svc-groups-modal" value={serviceModal.group} onChange={(e) => setServiceModal((m) => ({ ...m, group: e.target.value }))} placeholder="e.g. Airport Taxi Services" style={inp} />
              <datalist id="svc-groups-modal">{existingGroups.map((g) => <option key={g} value={g} />)}</datalist>

              <div style={{ fontSize: 12, marginTop: 12, minHeight: 18, color: badOnes.length ? "#DC2626" : "#6B7280", lineHeight: 1.6 }}>
                {badOnes.length ? <>Can't create: {badOnes.slice(0, 4).map((x) => `"${x.label || "(empty)"}"`).join(", ")}{badOnes.length > 4 ? "…" : ""} — already exists or invalid name.</>
                  : plan.length === 0 ? (preset ? (preset.input === "route" ? "Add at least one route, like “Bangalore to Mysore”." : "Add at least one city.") : "Lowercase letters, numbers and hyphens in the URL.")
                  : plan.length === 1 ? <>Lives at <code style={{ color: "#B8860B", fontWeight: 700 }}>/services/{plan[0].slug}</code></>
                  : <>Will create <b>{plan.length} pages</b>: {plan.slice(0, 3).map((x) => x.label).join(", ")}{plan.length > 3 ? ` … +${plan.length - 3} more` : ""}</>}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={close} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={submitServicePage} disabled={!valid} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: valid ? "#F5A623" : "#E5E7EB", color: valid ? "#111" : "#9CA3AF", fontSize: 13, fontWeight: 800, cursor: valid ? "pointer" : "default" }}>{plan.length > 1 ? `Create ${plan.length} pages` : "Create page"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete service page confirm (replaces the native confirm) ── */}
      {deleteModal.open && (
        <div onClick={() => setDeleteModal({ open: false, id: null, label: "" })} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", padding: 22, animation: "cms-slide-up 0.2s ease-out both" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#111" }}>Delete service page?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, lineHeight: 1.6 }}>"<b style={{ color: "#111" }}>{deleteModal.label}</b>" will be removed from the live site. This can't be undone.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button onClick={() => setDeleteModal({ open: false, id: null, label: "" })} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmDeleteServicePage} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Delete page</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 flex flex-col h-screen sticky top-0" style={{ background: "linear-gradient(180deg,#1B1B1B 0%,#1B1B1B82 60%,#111 100%)" }}>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md" style={{ background: "#F5A623" }}><Car size={14} className="text-[#111827]" /></div>
          <div className="leading-tight"><div className="text-[14px] font-extrabold text-white">AbhiCabs</div><div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#F5A623]">CMS</div></div>
        </div>
        <nav className="py-2 px-2 flex-1 overflow-y-auto space-y-0.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 px-3 pt-2 pb-1">Service pages</div>
          {servicePages.map(renderPageBtn)}
          {servicePages.length === 0 && <div className="px-3 py-1 text-[11px] text-white/30">None yet</div>}
          {BUILT_IN_SLUGS.filter((sl) => !pages[sl]).length > 0 && (
            <>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 px-3 pt-2 pb-1">Built-in (default content)</div>
              {BUILT_IN_SLUGS.filter((sl) => !pages[sl]).map((sl) => (
                <button key={sl} onClick={() => customizeBuiltIn(sl)} title="Copy the default content into an editable page"
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] rounded-lg text-[#9CA3AF] hover:text-white transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <span className="truncate">{SERVICE_LINKS.find((l) => l.href === `/services/${sl}`)?.short || sl}</span><span className="text-[10px] text-[#F5A623]">Customize</span>
                </button>
              ))}
            </>
          )}
          {canEdit && (
            <button onClick={openServiceModal}
              className="w-full flex items-center gap-2 px-3 py-1.5 mt-0.5 text-[12px] rounded-lg text-[#F5A623] hover:text-white transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Plus size={13} /> New service page
            </button>
          )}

          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 px-3 pt-3 pb-1">Content</div>
          <button onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] rounded-lg text-[#9CA3AF] hover:text-white transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <FileText size={13} /> Blog Posts
          </button>
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <div className="text-[10px] text-[#9CA3AF] truncate mb-1">{user?.email}</div>
          <button onClick={logout} className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-white transition-colors"><LogOut size={11} /> Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 900, color: "#0a0a0a", letterSpacing: "-0.02em", margin: 0 }}>
              {activePage ? PAGE_DEFS.find((p) => p.id === activePage)?.label + " Page" : "Page Manager"}
            </h1>
            {activePage && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, fontWeight: 500 }}>Pages → {PAGE_DEFS.find((p) => p.id === activePage)?.label || pages[activePage]?._label || activePage} → {viewMode === "preview" ? "Preview" : "Editing"}</p>}
          </div>
          {/* View mode toggle */}
          {activePage && (
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, gap: 2 }}>
              <button onClick={() => { setViewMode("preview"); setEditingIdx(null); }}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: viewMode === "preview" ? "#fff" : "transparent",
                  color: viewMode === "preview" ? "#0a0a0a" : "#9CA3AF",
                  boxShadow: viewMode === "preview" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
                }}><Eye size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />Preview</button>
              <button onClick={() => setViewMode("edit")}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: viewMode === "edit" ? "#fff" : "transparent",
                  color: viewMode === "edit" ? "#0a0a0a" : "#9CA3AF",
                  boxShadow: viewMode === "edit" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
                }}><Edit3 size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />Edit</button>
            </div>
          )}
          <div className="flex items-center gap-3">
            {activePage && saveMsg && (
              <span className={`text-[12px] font-semibold ${saveMsg.type === "ok" ? "text-[#059669]" : "text-red-600"}`}>
                {saveMsg.type === "ok" ? <CheckCircle size={13} className="inline mr-1" /> : <AlertCircle size={13} className="inline mr-1" />}{saveMsg.text}
              </span>
            )}
            {activePage && isTemplatePage(pages[activePage]) && (() => {
              const items = buildServiceChecklist(pages[activePage]._content);
              const done = items.filter((i) => i.status === "ok").length;
              const all = done === items.length;
              return (
                <button type="button" onClick={() => document.getElementById("svc-checklist")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  title="Open the checklist" className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border transition-colors"
                  style={all ? { background: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" } : { background: "#FFFBEB", color: "#92400E", borderColor: "#FDE68A" }}>
                  {all ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {done}/{items.length} ready
                </button>
              );
            })()}
            {activePage && (
              <button onClick={() => savePage(activePage)} disabled={saving}
                className="wp-primary flex items-center gap-2"
                style={{ padding: "10px 22px", fontSize: 13 }}>
                {saving ? <><Loader size={14} className="animate-spin" /> Saving…</> : <><Send size={14} /> Save Page</>}
              </button>
            )}
            {activePage && (
              <button onClick={() => setActivePage(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#9CA3AF", background: "none", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "7px 14px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; e.currentTarget.style.background = "#FFFBEB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "none"; }}>
                <ArrowLeft size={14} /> All Pages
              </button>
            )}
          </div>
        </div>

        <div className="max-w-[900px] mx-auto w-full px-6 py-8">
          {!activePage ? (
            <>
              {/* Hero header */}
              <div style={{ background: "linear-gradient(135deg,#18181B,#09090B)", borderRadius: 24, padding: "36px 32px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(245,166,35,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(245,166,35,0.05) 0%, transparent 50%)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>Service Pages</h2>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6, fontWeight: 500 }}>Create a service landing page from the ready-made template — just fill in the content. For articles, use Blog Posts.</p>
                </div>
              </div>

              {/* Page cards — service pages only (main pages aren't editable here) */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "2px 2px 10px", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>Service pages <span style={{ fontWeight: 600, color: "#9CA3AF" }}>· live at /services/…</span></div>
                {canEdit && (
                  <button onClick={openServiceModal} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                    <Plus size={14} /> New service page
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicePages.map((p, i) => renderPageCard(p, i, true))}
                {canEdit && (
                  <button onClick={openServiceModal}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, borderRadius: 20, border: "2px dashed #D1D5DB", background: "linear-gradient(135deg,#FAFAFA,#F3F4F6)", cursor: "pointer", transition: "all 0.25s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.background = "linear-gradient(135deg,#FFFBEB,#FEF3C7)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.background = "linear-gradient(135deg,#FAFAFA,#F3F4F6)"; }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plus size={24} style={{ color: "#9CA3AF" }} />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#374151" }}>Create service page</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>e.g. Airport Transfers, Corporate Travel</div>
                    </div>
                  </button>
                )}
                {servicePages.length === 0 && !canEdit && <div style={{ fontSize: 13, color: "#9CA3AF", padding: 8 }}>No service pages yet.</div>}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Page info header */}
              <div style={{ background: "linear-gradient(135deg,#18181B,#09090B)", borderRadius: 20, padding: "24px 28px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 50%, rgba(245,166,35,0.06) 0%, transparent 50%)" }} />
                <div style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, background: "rgba(255,255,255,0.08)", flexShrink: 0, position: "relative" }}><EmojiIcon glyph={PAGE_DEFS.find((p) => p.id === activePage)?.icon || pages[activePage]?._icon || "📄"} size={26} color="#F5A623" /></div>
                <div style={{ position: "relative" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>{PAGE_DEFS.find((p) => p.id === activePage)?.label || pages[activePage]?._label || activePage} Page</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 500 }}>
                    {isTemplatePage(pages[activePage]) ? "Fully customizable · add any section" : <>{currentSections.length} section{currentSections.length !== 1 ? "s" : ""} · reorder with arrows</>}
                    {(pages[activePage]?._service || pages[activePage]?._custom) && <> · <span style={{ color: "#F5A623" }}>Live at /services/{activePage}</span></>}
                  </p>
                </div>
              </div>

              {isTemplatePage(pages[activePage]) ? (
                <ServiceWorkspace
                  slug={pages[activePage]._slug || activePage}
                  content={pages[activePage]._content}
                  canEdit={canEdit}
                  liveUrl={livePageUrl}
                  groups={[...new Set(Object.values(pages).map((p) => p?._content?.group).filter(Boolean))]}
                  onUpload={(file) => compressAndUpload(file, { maxW: 1600, quality: 0.82 })}
                  onChange={(next) => setPages((prev) => ({ ...prev, [activePage]: { ...prev[activePage], _content: next } }))}
                />
              ) : (
              <>
              {/* Page SEO Analysis */}
              <PageSeoAnalyzer
                pageName={PAGE_DEFS.find((p) => p.id === activePage)?.label || pages[activePage]?._label || activePage}
                sections={currentSections}
                codeBacked={PAGE_DEFS.some((p) => p.id === activePage)}
              />

              {/* Home layout — reorder / show-hide built-in sections */}
              {activePage === "home" && (
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 3 }}>Page layout — reorder &amp; show / hide sections</div>
                  <div style={{ fontSize: 11.5, color: "#9CA3AF", marginBottom: 12 }}>Controls the built-in homepage sections. Click <b>Save</b> to apply, then Refresh the preview frame above.</div>
                  {normalizeHomeLayout().map((e, idx, arr) => {
                    const abtn = (disabled) => ({ width: 28, height: 28, borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: disabled ? "default" : "pointer", color: disabled ? "#D1D5DB" : "#374151", fontSize: 13, lineHeight: 1 });
                    return (
                      <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, border: "1px solid #F3F4F6", marginBottom: 6, background: e.hidden ? "#F9FAFB" : "#fff", opacity: e.hidden ? 0.6 : 1 }}>
                        <span style={{ fontSize: 11, color: "#9CA3AF", width: 18, textAlign: "right" }}>{idx + 1}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{HOME_LAYOUT_LABELS[e.key] || e.key}</span>
                        {canEdit && (
                          <>
                            <button onClick={() => moveHomeSection(e.key, -1)} disabled={idx === 0} title="Move up" style={abtn(idx === 0)}>↑</button>
                            <button onClick={() => moveHomeSection(e.key, 1)} disabled={idx === arr.length - 1} title="Move down" style={abtn(idx === arr.length - 1)}>↓</button>
                            <button onClick={() => toggleHomeSection(e.key)} title={e.hidden ? "Show on page" : "Hide from page"} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 800, color: e.hidden ? "#DC2626" : "#059669" }}>{e.hidden ? "Hidden" : "Shown"}</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sections — preview or edit mode */}
              {viewMode === "preview" ? (
                <>
                  {/* Live page — the COMPLETE page as visitors see it (header,
                      booking widget, fleet, banners, footer). Same origin, so it
                      renders the real route. Shows the last SAVED version. */}
                  <div style={{ marginBottom: 18, borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#0a0a0a", color: "#fff", flexWrap: "wrap" }}>
                      <Eye size={13} style={{ color: "#F5A623" }} />
                      <span style={{ fontSize: 12.5, fontWeight: 800 }}>Live page — complete, as visitors see it</span>
                      <code style={{ fontSize: 11, color: "#9CA3AF" }}>{livePageUrl}</code>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <button onClick={() => setLivePreviewKey((k) => k + 1)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
                        <a href={livePageUrl} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F5A623", color: "#0a0a0a", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, textDecoration: "none" }}>Open ↗</a>
                      </div>
                    </div>
                    <iframe key={livePreviewKey} title="Live page preview" src={livePageUrl}
                      style={{ width: "100%", height: 680, border: "none", background: "#fff", display: "block" }} />
                    <div style={{ padding: "7px 14px", fontSize: 11, color: "#9CA3AF", background: "#F9FAFB", borderTop: "1px solid #F3F4F6" }}>
                      Shows the last <b>saved</b> version. Save your edits, then Refresh to see them here.
                    </div>
                  </div>

                  {currentSections.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 2px 10px" }}>
                      Editable blocks on this page — click any to edit
                    </div>
                  )}

                  {currentSections.map((section, idx) => (
                    <div key={section.id || idx}>
                      <SectionPreview
                        section={section}
                        idx={idx}
                        onEdit={(i) => setEditingIdx(editingIdx === i ? null : i)}
                        isEditing={editingIdx === idx}
                      />
                      {editingIdx === idx && (
                        <div style={{ animation: "cms-fade-in 0.2s ease-out" }}>
                          <SectionEditor
                            section={section}
                            onChange={(updated) => updateSection(activePage, idx, updated)}
                            onRemove={() => { removeSection(activePage, idx); setEditingIdx(null); }}
                            onDuplicate={() => duplicateSection(activePage, idx)}
                            onMoveUp={() => { moveSection(activePage, idx, idx - 1); setEditingIdx(idx - 1); }}
                            onMoveDown={() => { moveSection(activePage, idx, idx + 1); setEditingIdx(idx + 1); }}
                            isFirst={idx === 0}
                            isLast={idx === currentSections.length - 1}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {currentSections.map((section, idx) => (
                    <SectionEditor
                      key={section.id || idx}
                      section={section}
                      onChange={(updated) => updateSection(activePage, idx, updated)}
                      onRemove={() => removeSection(activePage, idx)}
                      onDuplicate={() => duplicateSection(activePage, idx)}
                      onMoveUp={() => moveSection(activePage, idx, idx - 1)}
                      onMoveDown={() => moveSection(activePage, idx, idx + 1)}
                      isFirst={idx === 0}
                      isLast={idx === currentSections.length - 1}
                    />
                  ))}
                </>
              )}

              {/* Add section */}
              {addingSection ? (
                <div style={{ background: "#fff", borderRadius: 20, border: "2px solid #E5E7EB", padding: 24, animation: "cms-slide-up 0.3s ease-out" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0a0a0a" }}>Add a Section</span>
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Choose a content block to add</p>
                    </div>
                    <button onClick={() => setAddingSection(false)} style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", color: "#6B7280", fontSize: 14, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#EF4444"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#6B7280"; }}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SECTION_TYPES.map((t, i) => {
                      const colors = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EF4444","#06B6D4","#F97316","#EC4899","#14B8A6","#6366F1","#6B7280"];
                      const clr = colors[i % colors.length];
                      return (
                      <button key={t.type} onClick={() => addSection(activePage, t.type)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.2s cubic-bezier(.4,0,.2,1)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${clr}60`; e.currentTarget.style.background = `${clr}06`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${clr}15`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                        <span style={{ fontSize: 20, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${clr}10`, flexShrink: 0 }}><EmojiIcon glyph={t.icon} size={18} /></span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0a0a0a" }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1, lineHeight: 1.3 }}>{t.desc}</div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingSection(true)}
                  style={{ width: "100%", padding: "20px 16px", borderRadius: 18, border: "2px dashed #D1D5DB", background: "linear-gradient(135deg,#FAFAFA,#F3F4F6)", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.25s cubic-bezier(.4,0,.2,1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; e.currentTarget.style.background = "linear-gradient(135deg,#FFFBEB,#FEF3C7)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,166,35,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "linear-gradient(135deg,#FAFAFA,#F3F4F6)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <Plus size={18} /> Add Section
                </button>
              )}
              </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT — CMS with two sections: Pages and Blogs
// ═════════════════════════════════════════════════════════════════════════════
export default function AbhiCabsCMS() {
  const { isAuthenticated, loading } = useAuth();
  const [screen, setScreen] = useState("hub");
  const [editingBlog, setEditingBlog] = useState(null);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FAFB" }}>
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader size={28} className="animate-spin" style={{ color: "#1B1B1B" }} />
          <span className="text-sm">Verifying session…</span>
        </div>
      </div>
    );

  if (!isAuthenticated) return <LoginScreen />;

  // Hub — choose between Pages and Blogs
  if (screen === "hub") {
    return <CMSHub onPages={() => setScreen("pages")} onBlogs={() => setScreen("picker")} />;
  }
  if (screen === "pages") {
    return <PageEditor onBack={() => setScreen("hub")} />;
  }
  if (screen === "picker") {
    const deleteBlog = async (blog) => {
      try {
        // Fetch current blogs.js, remove the blog, commit back
        const GH_TOKEN = import.meta.env.VITE_GH_TOKEN;
        const GH_REPO = import.meta.env.VITE_GH_REPO || "skyupdigitalsolutions-cpu/abhicabs-customer-website";
        if (!GH_TOKEN) { alert("GitHub token not configured."); return; }
        const fileRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/src/data/blogs.js?ref=main`, {
          headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json" },
        });
        const file = await fileRes.json();
        const content = atob(file.content);
        // Remove the blog entry by slug
        const slugPattern = new RegExp(`\\{[^}]*slug:\\s*["']${blog.slug}["'][^}]*\\},?\\s*`, "g");
        const updated = content.replace(slugPattern, "").replace(/,\s*\]/, "\n]");
        const commitRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/src/data/blogs.js`, {
          method: "PUT",
          headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Delete blog: ${blog.headline || blog.title}`, content: btoa(unescape(encodeURIComponent(updated))), sha: file.sha, branch: "main" }),
        });
        if (!commitRes.ok) throw new Error("Failed to delete from GitHub");
        // Log the action
        addActivityLog("delete", "blog", blog.slug, blog.headline || blog.title);
        refreshLiveBlogs();
        alert(`"${blog.headline || blog.title}" has been deleted.`);
        window.location.reload();
      } catch (err) {
        alert("Delete failed: " + (err?.message || "Unknown error"));
      }
    };

    // Activity log — stored in localStorage
    const addActivityLog = (action, type, id, title) => {
      const logs = JSON.parse(localStorage.getItem("cms_activity_log") || "[]");
      logs.unshift({ action, type, id, title, user: user?.email || "admin", at: new Date().toISOString() });
      if (logs.length > 200) logs.length = 200;
      localStorage.setItem("cms_activity_log", JSON.stringify(logs));
    };

    return <BlogPicker onSelect={(blog) => { setEditingBlog(blog); setScreen("editor"); }} onPages={() => setScreen("pages")} onHub={() => setScreen("hub")} onDeleteBlog={deleteBlog} />;
  }
  return <BlogEditor editingBlog={editingBlog} onBack={() => { setScreen("picker"); setEditingBlog(null); }} />;
}

// ── CMS Hub — landing screen with two sections ──────────────────────────────
function CMSHub({ onPages, onBlogs }) {
  const { user, logout } = useAuth();
  const cards = [
    { key: "pages", onClick: onPages, Icon: Globe, title: "Pages", desc: "Edit hero text, images, stats, FAQs, and CTAs across all website pages", color: "#F5A623", count: "6 pages" },
    { key: "blogs", onClick: onBlogs, Icon: FileText, title: "Blog Posts", desc: "Create, edit, and publish articles with the rich text editor", color: "#059669", count: "Write & publish" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Urbanist', sans-serif", background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        @keyframes cms-enter { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }
        .cms-hub-card { animation: cms-enter 0.5s ease-out both; }
        .cms-hub-card:nth-child(2) { animation-delay: 0.1s; }
      `}</style>
      <div className="max-w-[520px] w-full px-6">
        <div className="flex flex-col items-center mb-12" style={{ animation: "cms-enter 0.4s ease-out" }}>
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 shadow-2xl" style={{ background: "linear-gradient(135deg, #1B1B1B, #0a0a0a)" }}>
            <Car size={30} className="text-[#F5A623]" />
          </div>
          <h1 className="text-[28px] font-extrabold text-[#111827] tracking-tight">AbhiCabs CMS</h1>
          <p className="text-[15px] text-[#9CA3AF] mt-1.5 font-medium">What would you like to work on?</p>
        </div>

        <div className="space-y-4">
          {cards.map(({ key, onClick, Icon, title, desc, color, count }) => (
            <button key={key} onClick={onClick}
              className="cms-hub-card w-full flex items-center gap-5 p-6 rounded-[20px] bg-white border border-[#E5E7EB]/80 hover:shadow-2xl transition-all group text-left relative overflow-hidden"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5" style={{ background: color }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:shadow-lg ml-2"
                style={{ background: `${color}14` }}>
                <Icon size={24} style={{ color }} className="transition-transform group-hover:rotate-[-8deg]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#111827] text-[18px]">{title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>{count}</span>
                </div>
                <div className="text-[13.5px] text-[#6B7280] mt-1 leading-snug">{desc}</div>
              </div>
              <ArrowLeft size={18} className="text-[#D1D5DB] group-hover:text-[#6B7280] rotate-180 transition-all group-hover:translate-x-1 shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-10">
          <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[11px] font-bold text-[#9CA3AF]">{(user?.name || user?.email || "A")[0].toUpperCase()}</div>
          <span className="text-[12px] text-[#9CA3AF] font-medium">{user?.email}</span>
          <span className="text-[#D1D5DB]">·</span>
          <button onClick={logout} className="text-[12px] text-[#9CA3AF] hover:text-[#EF4444] font-medium transition-colors flex items-center gap-1"><LogOut size={11} /> Sign out</button>
        </div>
      </div>
    </div>
  );
}