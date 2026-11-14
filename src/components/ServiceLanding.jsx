import React, { useState } from "react";
import { CheckCircle2, ArrowRight, ArrowLeft, Quote, Play, ExternalLink } from "lucide-react";
import { EYEBROW } from "./ui/classNames";
import Section from "./ui/Section";
import SectionHead from "./ui/SectionHead";
import PageHero from "./ui/PageHero";
import Accordion from "./ui/Accordion";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import ServiceDirectory from "./ServiceDirectory";
import RelatedGuides from "./RelatedGuides";
import SectionRenderer from "./SectionRenderer";
import ServiceBooking, { scrollToBooking } from "./ServiceBooking";
import useCmsContent from "../hooks/useCmsContent";
import { usePageContext } from "vike-react/usePageContext";
import { contactFormHref } from "../data/siteLinks";
import useServiceLinks from "../hooks/useServiceLinks";
import { cldOptimize } from "../utils/cloudinaryUrl";
import { resolveIcon } from "./ui/iconMap";

/**
 * Fully dynamic landing-page engine for service pages.
 *
 * LAYOUT: `cfg.layout` controls section order, visibility and per-section tone.
 * CUSTOM SECTIONS: text, stats, testimonial, gallery, video, banner, comparison, iconList, checklist.
 * BACKWARD COMPATIBLE: pages without layout use the original fixed order.
 */

const DEFAULT_STEPS = [
  { title: "Tell us your trip", desc: "Enter pickup, drop and time." },
  { title: "Get an instant fare", desc: "See the full price up front." },
  { title: "Choose your vehicle", desc: "Pick the car that fits." },
  { title: "Confirm & ride", desc: "A verified driver, on time." },
];

/** "Explore our [cab fleet](/fleet) today" → text with a real internal link. Plain strings pass through unchanged. */
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
export function renderInline(text) {
  if (typeof text !== "string" || !text.includes("](")) return text;
  const out = []; let last = 0; let m; LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<a key={m.index} href={m[2]} className="font-semibold text-[#B88A00] underline underline-offset-2 hover:text-[#111]">{m[1]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
/** "Sedan Airport Cabs: Swift Dzire…" → bold label + description. Lines without "Label: " render as-is. */
const labelled = (t) => {
  const i = typeof t === "string" ? t.indexOf(": ") : -1;
  return i > 0 && i < 60 ? <><strong className="font-bold text-text">{t.slice(0, i)}:</strong> {renderInline(t.slice(i + 2))}</> : renderInline(t);
};

const DEFAULT_LAYOUT = [
  { id: "hero", enabled: true },
  { id: "intro", enabled: true },
  { id: "features", enabled: true },
  { id: "pricing", enabled: true },
  { id: "routes", enabled: true },
  { id: "how", enabled: true },
  { id: "faqs", enabled: true },
  { id: "relatedGuides", enabled: true },
  { id: "exploreServices", enabled: true },
  { id: "serviceDirectory", enabled: true },
  { id: "cta", enabled: true },
];

export { DEFAULT_LAYOUT };

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM SECTION RENDERERS — 9 block types
   ═══════════════════════════════════════════════════════════════════════ */

function CustomTextSection({ data }) {
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {data.heading && <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight mb-2">{data.heading}</h2>}
          {data.subtitle && <p className="text-[15px] text-text-secondary mb-4">{data.subtitle}</p>}
          {(data.body || []).map((p, i) => <p key={i} className="mt-3 text-text-secondary text-[15.5px] leading-relaxed">{p}</p>)}
          {data.image && (
            <div className="mt-8 rounded-[18px] overflow-hidden">
              <img src={typeof cldOptimize === "function" ? cldOptimize(data.image, { width: 900 }) : data.image} alt={data.imageAlt || ""} loading="lazy" className="w-full aspect-[16/9] object-cover" />
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomStatsSection({ data }) {
  return (
    <Section tone={data.tone || "tint"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className="flex justify-center gap-[clamp(24px,5vw,56px)] flex-wrap">
          {(data.items || []).map((item, i) => (
            <div key={i} className="text-center min-w-[100px]">
              <div className="text-[36px] font-black text-[#E6AC00] tracking-tight">{item.value}</div>
              <div className="text-[14px] text-text-secondary font-semibold mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomTestimonialSection({ data }) {
  return (
    <Section tone={data.tone || "white"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(data.items || []).map((t, i) => (
            <Card key={i} className="p-6">
              <Quote size={20} className="text-[#E6AC00] mb-3" aria-hidden />
              <p className="text-[14.5px] italic leading-relaxed text-text-secondary mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center text-[14px] font-bold text-[#E6AC00]">{t.name ? t.name[0].toUpperCase() : "?"}</div>
                <div>
                  <div className="text-[13.5px] font-bold">{t.name}</div>
                  {t.role && <div className="text-[11.5px] text-text-secondary">{t.role}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomGallerySection({ data }) {
  const cols = data.columns || 4;
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} gap-3`} style={{ gridTemplateColumns: undefined }}>
          {(data.images || []).map((img, i) => (
            <div key={i} className="rounded-[16px] overflow-hidden aspect-[4/3]">
              {img.url ? (
                <img src={typeof cldOptimize === "function" ? cldOptimize(img.url, { width: 600 }) : img.url} alt={img.alt || ""} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] text-[13px]">No image</div>
              )}
            </div>
          ))}
        </div>
        {data.caption && <p className="text-center text-[13px] text-text-secondary mt-4">{data.caption}</p>}
      </Reveal>
    </Section>
  );
}

function CustomVideoSection({ data }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return url;
  };
  const embed = getEmbedUrl(data.url);
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
          {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
          {!data.subtitle && data.heading && <div className="mb-9" />}
          {embed ? (
            <div className="rounded-[18px] overflow-hidden" style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe src={embed} title={data.heading || "Video"} allow="autoplay; fullscreen" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} loading="lazy" />
            </div>
          ) : (
            <div className="rounded-[18px] bg-[#F3F4F6] flex items-center justify-center py-20 text-[#9CA3AF] text-[14px]">
              <Play size={24} className="mr-2" /> Add a YouTube or Vimeo URL
            </div>
          )}
          {data.caption && <p className="text-center text-[13px] text-text-secondary mt-4">{data.caption}</p>}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomBannerSection({ data }) {
  const isDark = (data.tone || "dark") === "dark";
  return (
    <Section tone={data.tone || "dark"}>
      <Reveal>
        <div className={`rounded-[22px] p-8 md:p-12 text-center ${isDark ? "text-white" : ""}`} style={isDark ? { background: "linear-gradient(140deg,#1C1C1C,#0a0a0a)" } : {}}>
          {data.heading && <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight leading-tight">{data.heading}</h2>}
          {data.subtitle && <p className={`mt-3 text-[15px] ${isDark ? "text-gray-300" : "text-text-secondary"}`}>{data.subtitle}</p>}
          {data.buttonText && data.buttonUrl && (
            <div className="mt-7">
              <a href={data.buttonUrl} className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] transition-all ${isDark ? "bg-[#E6AC00] text-[#111] hover:bg-[#FFD54F]" : "bg-[#111] text-white hover:bg-[#333]"}`}>
                {data.buttonText} <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomComparisonSection({ data }) {
  const cols = data.columns || [];
  const rows = data.rows || [];
  return (
    <Section tone={data.tone || "white"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className="overflow-x-auto rounded-[16px] border border-border">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="p-4 font-bold border-b border-border text-[13px]">{data.featureLabel || "Feature"}</th>
                {cols.map((col, i) => <th key={i} className="p-4 font-bold border-b border-border text-[13px] text-center">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 ? "bg-[#FAFAFA]" : "bg-white"}>
                  <td className="p-4 font-semibold border-b border-[#F3F4F6] text-[13.5px]">{row.feature}</td>
                  {(row.values || []).map((v, ci) => (
                    <td key={ci} className="p-4 text-center border-b border-[#F3F4F6] text-[13.5px]">
                      {v === "yes" ? <CheckCircle2 size={18} className="text-[#16A34A] mx-auto" /> : v === "no" ? <span className="text-[#D1D5DB]">—</span> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}

function CustomIconListSection({ data }) {
  return (
    <Section tone={data.tone || "white"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(data.items || []).map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <Card className="p-5 h-full">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[11px] bg-primary-tint flex items-center justify-center text-[18px] shrink-0">{item.emoji || "✦"}</div>
                  <div>
                    <h4 className="text-[14.5px] font-bold">{item.title}</h4>
                    <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function CustomChecklistSection({ data }) {
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {data.heading && <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight mb-2">{data.heading}</h2>}
          {data.subtitle && <p className="text-[15px] text-text-secondary mb-6">{data.subtitle}</p>}
          <ul className="space-y-3">
            {(data.items || []).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[14.5px]">
                <CheckCircle2 size={20} className="text-[#16A34A] shrink-0 mt-0.5" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Rich Content (HTML body with images, links, tables inline) ── */
function CustomRichContentSection({ data }) {
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {data.heading && <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight mb-2">{data.heading}</h2>}
          {data.subtitle && <p className="text-[15px] text-text-secondary mb-6">{data.subtitle}</p>}
          <div className="prose prose-sm max-w-none
            [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-text-secondary [&_p]:mb-4
            [&_a]:text-[#E6AC00] [&_a]:font-semibold [&_a]:underline
            [&_img]:rounded-[16px] [&_img]:my-6 [&_img]:w-full [&_img]:max-w-full
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
            [&_li]:text-[14.5px] [&_li]:mb-1.5
            [&_table]:w-full [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-border [&_table]:my-6
            [&_th]:bg-[#F9FAFB] [&_th]:p-3 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-bold [&_th]:border-b [&_th]:border-border
            [&_td]:p-3 [&_td]:text-[13.5px] [&_td]:border-b [&_td]:border-[#F3F4F6]
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#E6AC00] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:my-5"
            dangerouslySetInnerHTML={{ __html: data.html || "" }} />
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Table section ── */
function CustomTableSection({ data }) {
  const headers = data.headers || [];
  const rows = data.rows || [];
  return (
    <Section tone={data.tone || "white"}>
      <Reveal>
        {data.heading && <SectionHead center className="mb-2" title={data.heading} />}
        {data.subtitle && <p className="text-center text-[14px] text-text-secondary mb-9">{data.subtitle}</p>}
        {!data.subtitle && data.heading && <div className="mb-9" />}
        <div className="overflow-x-auto rounded-[16px] border border-border">
          <table className="w-full text-left text-[14px]" style={{ borderCollapse: "collapse" }}>
            {headers.length > 0 && (
              <thead>
                <tr className="bg-[#F9FAFB]">
                  {headers.map((h, i) => <th key={i} className="p-4 font-bold border-b border-border text-[13px]">{h}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 ? "bg-[#FAFAFA]" : "bg-white"}>
                  {(row.cells || []).map((cell, ci) => (
                    <td key={ci} className="p-4 text-[13.5px] border-b border-[#F3F4F6]">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.caption && <p className="text-center text-[13px] text-text-secondary mt-3">{data.caption}</p>}
      </Reveal>
    </Section>
  );
}

/* ── Buttons / Links row ── */
function CustomButtonsSection({ data }) {
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: data.align || "center" }}>
          {data.heading && <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight mb-2">{data.heading}</h2>}
          {data.subtitle && <p className="text-[15px] text-text-secondary mb-7">{data.subtitle}</p>}
          {!data.subtitle && data.heading && <div className="mb-7" />}
          <div className="flex flex-wrap gap-3" style={{ justifyContent: data.align || "center" }}>
            {(data.buttons || []).map((btn, i) => (
              <a key={i} href={btn.url || "#"} target={btn.external ? "_blank" : undefined} rel={btn.external ? "noopener noreferrer" : undefined}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] transition-all ${
                  btn.style === "outline"
                    ? "border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white"
                    : btn.style === "ghost"
                    ? "text-[#E6AC00] hover:underline"
                    : "bg-[#E6AC00] text-[#111] hover:bg-[#FFD54F] shadow-md"
                }`}>
                {btn.label || "Click Here"}
                {btn.external && <ExternalLink size={13} />}
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Image + Text (side by side) ── */
function CustomImageTextSection({ data }) {
  const imgLeft = (data.imagePosition || "left") === "left";
  return (
    <Section tone={data.tone || "page"}>
      <Reveal>
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${!imgLeft ? "lg:[direction:rtl] [&>*]:[direction:ltr]" : ""}`}>
          <div className="rounded-[18px] overflow-hidden">
            {data.image ? (
              <img src={typeof cldOptimize === "function" ? cldOptimize(data.image, { width: 800 }) : data.image} alt={data.imageAlt || ""} loading="lazy" className="w-full aspect-[4/3] object-cover" />
            ) : (
              <div className="w-full aspect-[4/3] bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">No image</div>
            )}
            {data.imageCaption && <p className="text-[12px] text-text-secondary mt-2 text-center">{data.imageCaption}</p>}
          </div>
          <div>
            {data.heading && <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight mb-3">{data.heading}</h2>}
            {data.subtitle && <p className="text-[15px] text-text-secondary mb-4">{data.subtitle}</p>}
            {(data.body || []).map((p, i) => <p key={i} className="mt-3 text-text-secondary text-[15px] leading-relaxed">{p}</p>)}
            {data.linkText && data.linkUrl && (
              <a href={data.linkUrl} className="inline-flex items-center gap-2 mt-5 text-[14px] font-bold text-[#E6AC00] hover:underline">
                {data.linkText} <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const CUSTOM_RENDERERS = {
  text: CustomTextSection,
  stats: CustomStatsSection,
  testimonial: CustomTestimonialSection,
  gallery: CustomGallerySection,
  video: CustomVideoSection,
  banner: CustomBannerSection,
  comparison: CustomComparisonSection,
  iconList: CustomIconListSection,
  checklist: CustomChecklistSection,
  richContent: CustomRichContentSection,
  table: CustomTableSection,
  buttons: CustomButtonsSection,
  imageText: CustomImageTextSection,
};

export { CUSTOM_RENDERERS };

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM SECTION FACTORY — blank data for each type
   ═══════════════════════════════════════════════════════════════════════ */
export function newCustomSection(type) {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type, heading: "", subtitle: "", tone: "" };
  switch (type) {
    case "text":        return { ...base, heading: "New Text Section", body: ["Add your content here."], image: "", imageAlt: "" };
    case "stats":       return { ...base, heading: "Our Numbers", items: [{ value: "500+", label: "Trips Completed" }, { value: "4.8★", label: "Average Rating" }] };
    case "testimonial": return { ...base, heading: "What Customers Say", items: [{ quote: "Great service!", name: "Customer", role: "" }] };
    case "gallery":     return { ...base, heading: "Gallery", images: [{ url: "", alt: "" }], caption: "", columns: 4 };
    case "video":       return { ...base, heading: "Watch", url: "", caption: "" };
    case "banner":      return { ...base, heading: "Ready to get started?", subtitle: "Book your ride in under a minute.", buttonText: "Book Now", buttonUrl: "", tone: "dark" };
    case "comparison":  return { ...base, heading: "Compare Options", featureLabel: "Feature", columns: ["Basic", "Premium"], rows: [{ feature: "Example Feature", values: ["yes", "no"] }] };
    case "iconList":    return { ...base, heading: "What's Included", items: [{ emoji: "✓", title: "Feature", desc: "Description" }] };
    case "checklist":   return { ...base, heading: "What to Expect", items: ["First item", "Second item"] };
    case "richContent": return { ...base, heading: "Detailed Content", html: "<h2>Sub-heading</h2><p>Write anything here — add <strong>bold</strong>, <em>italic</em>, <a href='/services'>links</a>, images, tables, lists.</p><ul><li>Item one</li><li>Item two</li></ul>" };
    case "table":       return { ...base, heading: "Information Table", headers: ["Column 1", "Column 2", "Column 3"], rows: [{ cells: ["Row 1", "Data", "Data"] }], caption: "" };
    case "buttons":     return { ...base, heading: "Quick Links", buttons: [{ label: "Book Now", url: "#booking", style: "primary", external: false }, { label: "View Fleet", url: "/fleet", style: "outline", external: false }], align: "center" };
    case "imageText":   return { ...base, heading: "About This Service", body: ["Describe the service in detail here."], image: "", imageAlt: "", imageCaption: "", imagePosition: "left", linkText: "Learn More", linkUrl: "" };
    default:            return { ...base, heading: "New Section", body: [] };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION TYPE REGISTRY — used by both landing page and CMS form
   ═══════════════════════════════════════════════════════════════════════ */
export const CUSTOM_SECTION_TYPES = [
  { type: "richContent", label: "Rich Content",    emoji: "R", desc: "Full editor — text, images, links, tables, HTML" },
  { type: "imageText",   label: "Image + Text",    emoji: "I", desc: "Image beside text with link" },
  { type: "text",        label: "Text Block",      emoji: "T", desc: "Heading + paragraphs + optional image" },
  { type: "table",       label: "Data Table",      emoji: "⊞", desc: "Rows & columns with headers" },
  { type: "buttons",     label: "Buttons / Links", emoji: "→", desc: "Row of link buttons" },
  { type: "stats",       label: "Stats / Numbers", emoji: "#", desc: "Number cards (e.g. 500+ trips)" },
  { type: "testimonial", label: "Testimonials",    emoji: "Q", desc: "Customer quotes with avatar" },
  { type: "gallery",     label: "Image Gallery",   emoji: "G", desc: "Photo grid with captions" },
  { type: "video",       label: "Video Embed",     emoji: "V", desc: "YouTube or Vimeo video" },
  { type: "banner",      label: "Banner / CTA",    emoji: "!", desc: "Call-to-action block with button" },
  { type: "comparison",  label: "Comparison Table", emoji: "=", desc: "Feature comparison grid" },
  { type: "iconList",    label: "Icon List",       emoji: "*", desc: "Cards with emoji/icon + text" },
  { type: "checklist",   label: "Checklist",       emoji: "✓", desc: "Tick list of items" },
];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function ServiceLanding({ cfg }) {
  const canBook = !!cfg.mode;
  const related = [...useServiceLinks().filter((l) => l.href !== `/services/${cfg.slug}`).map((l) => ({ label: l.short, href: l.href })), { label: "All Services", href: "/services" }];
  const primaryLabel = cfg.primaryLabel || (canBook ? "Book Your Ride" : "Send an Enquiry");

  const defaults = {
    hero: { title: cfg.hero.heading, accent: "", description: cfg.hero.description, image: cfg.hero.image },
    faqs: cfg.faqs.map(([q, a]) => ({ q, a })),
    cta: { line1: cfg.cta.line1, line2: cfg.cta.line2, description: cfg.cta.description, primaryLabel: cfg.cta.buttonLabel || primaryLabel },
  };
  const { content: c, extraSections } = useCmsContent(cfg.slug, defaults);

  const search = usePageContext().urlParsed?.search || {};
  const [widget, setWidget] = useState({ key: search.from ? "preset" : "default", pickup: search.from || "", drop: search.to || "" });
  const pickRoute = (pickup, drop) => { setWidget({ key: `r-${Date.now()}`, pickup, drop }); scrollToBooking(); };
  const goBook = () => (canBook ? scrollToBooking() : (window.location.href = contactFormHref(cfg.enquirySubject || "corporate")));
  const BookBtn = ({ children = primaryLabel, ...p }) => canBook
    ? <Button onClick={scrollToBooking} {...p}>{children}</Button>
    : <Button href={contactFormHref(cfg.enquirySubject || "corporate")} {...p}>{children}</Button>;

  // Helper: get tone override from layout item, or use default
  const getTone = (sectionId, fallback) => {
    const item = (cfg.layout || []).find((l) => l.id === sectionId);
    return item?.tone || fallback;
  };

  // ── Built-in section renderers ──
  const SECTIONS = {
    hero: () => (
      <PageHero
        center={canBook} image={c.hero.image} imageAlt={cfg.hero.alt || ""}
        breadcrumb={cfg.breadcrumb || [["Home", "/"], ["Services", "/services"], [cfg.hero.eyebrow, null]]}
        title={c.hero.title} subtitle={cfg.hero.subheading} description={c.hero.description}
        actions={!canBook && <>
          <Button href={contactFormHref(cfg.enquirySubject || "corporate")} size="lg">{primaryLabel}</Button>
          <Button href="/services" variant="outlineInverse" size="lg">All Services</Button>
        </>}
      >
        {canBook && <ServiceBooking widgetKey={widget.key} initialMode={cfg.mode} presetPickup={widget.pickup} presetDrop={widget.drop} />}
      </PageHero>
    ),

    intro: () => (
      <Section tone={getTone("intro", "page")}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-11 lg:gap-16 items-center">
          <Reveal>
            <div className={EYEBROW}>{cfg.intro.eyebrow}</div>
            <h2 className="text-[27px] md:text-[34px] font-bold tracking-tight leading-tight">{cfg.intro.heading}</h2>
            {(cfg.intro.body || []).map((p, i) => <p key={i} className="mt-4 text-text-secondary text-[15.5px] leading-relaxed">{renderInline(p)}</p>)}
            {(cfg.intro.items || []).map((it) => (
              <div key={it.heading} className="mt-7">
                <h3 className="text-[17.5px] md:text-[19px] font-bold leading-snug">{it.heading}</h3>
                {[].concat(it.body || []).map((p, i) => <p key={i} className="mt-2 text-text-secondary text-[15px] leading-relaxed">{renderInline(p)}</p>)}
              </div>
            ))}
            {cfg.intro.bullets?.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {cfg.intro.bullets.map((b) => (<li key={b} className="flex items-start gap-2.5 text-[14.5px]"><CheckCircle2 size={18} className="text-[#16A34A] shrink-0 mt-px" aria-hidden /> {b}</li>))}
              </ul>
            )}
            <div className="mt-7"><BookBtn size="lg" /></div>
          </Reveal>
          <Reveal delay={0.1}>
            <img src={cfg.intro.image} alt={cfg.intro.alt || ""} loading="lazy" className="rounded-[22px] w-full aspect-[5/4] object-cover" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.14)" }} />
          </Reveal>
        </div>
      </Section>
    ),

    features: () => (
      <Section tone={getTone("features", "white")}>
        <Reveal><SectionHead center className="mb-11" eyebrow={cfg.features.eyebrow || "What You Get"} title={cfg.features.heading} subheading={cfg.features.subheading} /></Reveal>
        {cfg.features.intro && <Reveal><p className="max-w-[780px] mx-auto text-center -mt-6 mb-10 text-text-secondary text-[15.5px] leading-relaxed">{renderInline(cfg.features.intro)}</p></Reveal>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {cfg.features.items.map((f, i) => { const FeatureIcon = resolveIcon(f); return (
            <Reveal key={f.title} delay={i * 0.06}>
              <Card className="p-4 sm:p-6 h-full flex sm:block items-start gap-3.5">
                <div className="w-10 h-10 sm:w-[46px] sm:h-[46px] shrink-0 rounded-[12px] sm:rounded-[13px] bg-primary-tint flex items-center justify-center sm:mb-3"><FeatureIcon size={20} className="text-[#E6AC00]" aria-hidden /></div>
                <div className="min-w-0">
                  <h4 className="text-[15px] sm:text-[15.5px] font-bold">{f.title}</h4>
                  <p className="text-[13px] text-text-secondary mt-1 sm:mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              </Card>
            </Reveal>
          ); })}
        </div>
      </Section>
    ),

    pricing: () => (
      <Section tone={getTone("pricing", "tint")} narrow>
        <Reveal><SectionHead center className="mb-9" eyebrow={cfg.pricing.eyebrow || "Pricing"} title={cfg.pricing.heading} subheading={cfg.pricing.subheading} description={cfg.pricing.description} /></Reveal>
        <div className="rounded-[22px] overflow-hidden border border-border grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-white">
          <div className="p-5 sm:p-8 md:p-10">
            {cfg.pricing.listHeading !== null && <h3 className="text-[17px] font-bold">{cfg.pricing.listHeading || "What affects your fare"}</h3>}
            {cfg.pricing.intro && <p className="text-[14.5px] text-text-secondary leading-relaxed">{renderInline(cfg.pricing.intro)}</p>}
            <ul className="mt-4 space-y-3">
              {cfg.pricing.points.map((t) => (<li key={t} className="flex items-start gap-3 text-[14.5px] leading-relaxed"><CheckCircle2 size={18} className="text-[#E6AC00] shrink-0 mt-[3px]" aria-hidden /> <span>{labelled(t)}</span></li>))}
            </ul>
            <p className="text-[13px] text-text-secondary mt-5 leading-relaxed">{cfg.pricing.note || "Amounts are indicative. Get an exact, all-inclusive quote in the booking flow — the same pricing used at checkout."}</p>
            {(cfg.pricing.links || []).map((l, i) => <p key={i} className="text-[14px] mt-3 leading-relaxed">{renderInline(l)}</p>)}
          </div>
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center text-white" style={{ background: "linear-gradient(140deg,#1C1C1C,#0a0a0a)" }}>
            <div className="text-[13px] font-bold text-primary">No hidden charges</div>
            <p className="text-[21px] font-bold mt-2 leading-tight">See your exact fare before you book</p>
            <div className="mt-6"><BookBtn variant="inverse" size="lg">{cfg.pricing.ctaLabel || (canBook ? "Calculate My Fare" : "Talk to Us")}</BookBtn></div>
          </div>
        </div>
      </Section>
    ),

    fleet: () => cfg.fleet ? (
      <Section tone={getTone("fleet", "white")} narrow>
        <Reveal><SectionHead center className="mb-9" eyebrow={cfg.fleet.eyebrow || "Our Fleet"} title={cfg.fleet.heading} subheading={cfg.fleet.subheading} /></Reveal>
        <div className="rounded-[22px] overflow-hidden border border-border grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-white">
          <div className="p-5 sm:p-8 md:p-10">
            {cfg.fleet.intro && <p className="text-[14.5px] text-text-secondary leading-relaxed">{renderInline(cfg.fleet.intro)}</p>}
            <ul className="mt-4 space-y-3">
              {(cfg.fleet.points || []).map((t) => (<li key={t} className="flex items-start gap-3 text-[14.5px] leading-relaxed"><CheckCircle2 size={18} className="text-[#E6AC00] shrink-0 mt-[3px]" aria-hidden /> <span>{labelled(t)}</span></li>))}
            </ul>
            {cfg.fleet.note && <p className="text-[13px] text-text-secondary mt-5 leading-relaxed">{cfg.fleet.note}</p>}
            {(cfg.fleet.links || []).map((l, i) => <p key={i} className="text-[14px] mt-3 leading-relaxed">{renderInline(l)}</p>)}
          </div>
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center text-white" style={{ background: "linear-gradient(140deg,#1C1C1C,#0a0a0a)" }}>
            <p className="text-[21px] font-bold mt-2 leading-tight">Find the right vehicle for your journey</p>
            <div className="mt-6"><BookBtn variant="inverse" size="lg" href="/fleet">{cfg.fleet.ctaLabel || "Explore Our Fleet"}</BookBtn></div>
          </div>
        </div>
      </Section>
    ) : null,

    routes: () => cfg.routes?.length > 0 ? (
      <Section tone={getTone("routes", "white")}>
        <Reveal><SectionHead center className="mb-11" eyebrow="Popular Routes" title={cfg.routesHeading || "Frequently booked routes"} /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cfg.routes.map((r) => (
            <button type="button" key={`${r.from}-${r.to}`} onClick={() => pickRoute(r.from, r.to)} className="group flex items-center justify-between rounded-[16px] border border-border bg-primary-tint p-4 hover:shadow-md transition-shadow text-left w-full">
              <span className="text-[14px] font-bold">{r.from} → {r.to}</span>
              <ArrowRight size={16} className="text-[#E6AC00] group-hover:translate-x-1 transition-transform" aria-hidden />
            </button>
          ))}
        </div>
      </Section>
    ) : null,

    coverage: () => cfg.coverage ? (
      <Section tone={getTone("coverage", "white")}>
        <Reveal><SectionHead center className="mb-8" eyebrow={cfg.coverage.eyebrow || "Service Areas"} title={cfg.coverage.heading} subheading={cfg.coverage.subheading} /></Reveal>
        <Reveal>
          <div className="max-w-[780px] mx-auto text-center">
            {(cfg.coverage.body || []).map((p, i) => <p key={i} className="mt-3 text-text-secondary text-[15.5px] leading-relaxed">{renderInline(p)}</p>)}
          </div>
        </Reveal>
        {cfg.routes?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {cfg.routes.map((r) => (
              <button type="button" key={`${r.from}-${r.to}`} onClick={() => pickRoute(r.from, r.to)} className="group flex items-center justify-between rounded-[16px] border border-border bg-primary-tint p-4 hover:shadow-md transition-shadow text-left w-full">
                <span className="text-[14px] font-bold">{r.from} → {r.to}</span>
                <ArrowRight size={16} className="text-[#E6AC00] group-hover:translate-x-1 transition-transform" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </Section>
    ) : null,

    tips: () => cfg.tips ? (
      <Section tone={getTone("tips", "tint")} narrow>
        <Reveal><SectionHead center className="mb-8" eyebrow={cfg.tips.eyebrow || "Before You Book"} title={cfg.tips.heading} subheading={cfg.tips.subheading} /></Reveal>
        <Reveal>
          <div className="rounded-[20px] sm:rounded-[22px] border border-border bg-white p-5 sm:p-7 md:p-10">
            {cfg.tips.intro && <p className="text-[15px] text-text-secondary leading-relaxed mb-5">{renderInline(cfg.tips.intro)}</p>}
            <ul className="space-y-3.5">
              {(cfg.tips.items || []).map((t) => (
                <li key={t.title} className="flex items-start gap-3 text-[14.5px] leading-relaxed">
                  <CheckCircle2 size={19} className="text-[#16A34A] shrink-0 mt-[2px]" aria-hidden />
                  <span><strong className="font-bold">{t.title}:</strong> <span className="text-text-secondary">{renderInline(t.desc)}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>
    ) : null,

    how: () => (
      <Section tone={getTone("how", "page")}>
        <Reveal><SectionHead center className="mb-12" eyebrow="How It Works" title={cfg.how?.heading || "Booked in a few simple steps"} subheading={cfg.how?.subheading} /></Reveal>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${(cfg.how?.steps || DEFAULT_STEPS).length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6`}>
          {(cfg.how?.steps || DEFAULT_STEPS).map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="w-11 h-11 rounded-xl bg-[#111] text-primary flex items-center justify-center font-extrabold text-[18px] mb-3.5">{i + 1}</div>
              <h4 className="text-[15.5px] font-bold">{s.title}</h4>
              <p className="text-[13.5px] text-text-secondary mt-1.5 leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-10"><BookBtn size="lg">{cfg.how?.ctaLabel || (canBook ? "Start Booking" : "Contact Us")}</BookBtn></div>
      </Section>
    ),

    faqs: () => (
      <Section tone={getTone("faqs", "white")} narrow>
        <Reveal><SectionHead center className="mb-9" eyebrow="FAQ" title={cfg.faqHeading || "Frequently asked questions"} /></Reveal>
        <Accordion items={c.faqs} tone="tint" />
      </Section>
    ),

    relatedGuides: () => <RelatedGuides mode={cfg.mode} />,
    extraSections: () => extraSections.length > 0 ? <SectionRenderer sections={extraSections} /> : null,

    exploreServices: () => (
      <Section tone={getTone("exploreServices", "page")} className="!py-12">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h3 className="text-[16px] font-bold">Explore other services</h3>
          <a href="/services" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#E6AC00] hover:gap-2.5 transition-all"><ArrowLeft size={15} aria-hidden /> Back to all services</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {related.map((r) => (<a key={r.href} href={r.href} className="rounded-[14px] border border-border bg-white p-4 text-center hover:border-primary hover:shadow-md transition-all"><span className="text-[13.5px] font-bold">{r.label}</span></a>))}
        </div>
      </Section>
    ),

    serviceDirectory: () => <ServiceDirectory exclude={cfg.slug} tone={getTone("serviceDirectory", "white")} />,
    cta: () => (
      <section className="py-14 md:py-20">
        <div style={{ maxWidth: 1264, margin: "0 auto", padding: "0 24px" }}>
          <div className="rounded-[22px] p-9 md:p-14 text-white grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-center" style={{ background: "linear-gradient(135deg,#1C1C1C,#0a0a0a)" }}>
            <div>
              <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight leading-tight">
                {c.cta.line1}{c.cta.line2 ? <> <span className="text-[#FFD54F]">{c.cta.line2}</span></> : null}
              </h2>
              {cfg.cta.subheading && c.cta.line1 === cfg.cta.line1 && <p className="mt-2 text-[#FFD54F] font-bold text-[16px]">{cfg.cta.subheading}</p>}
              {c.cta.description && <p className="mt-3 text-white/75 text-[15px] leading-relaxed">{c.cta.description}</p>}
            </div>
            <div className="flex flex-wrap lg:justify-end gap-3">
              <BookBtn variant="inverse" size="lg">{c.cta.primaryLabel}</BookBtn>
              {!canBook && <Button href="/services" variant="outlineInverse" size="lg">All Services</Button>}
              {canBook && <Button href="/contact-us" variant="outlineInverse" size="lg">Talk to Us</Button>}
            </div>
          </div>
        </div>
      </section>
    ),
  };

  // ── Generic content block (layout id "block:<key>" → cfg.blocks[key]) ──
  //   { eyebrow, heading (H2), subheading (H3), intro: [p], cards: [{ title (H3), body }], points: ["Label: text"],
  //     columns, note, links: [p], cta: { label, href? } (no href → scrolls to the booking form), tone }
  const renderBlock = (key, b) => {
    if (!b) return null;
    const cols = b.columns || (b.cards?.length % 3 === 0 || b.cards?.length > 4 ? 3 : 2);
    const gridCols = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
    return (
      <Section tone={getTone(`block:${key}`, b.tone || "white")} narrow={!b.cards && b.columns !== 2}>
        <Reveal><SectionHead center className="mb-8" eyebrow={b.eyebrow} title={b.heading} subheading={b.subheading} /></Reveal>
        {b.intro?.length > 0 && (
          <Reveal><div className="max-w-[780px] mx-auto text-center mb-8">
            {[].concat(b.intro).map((p, i) => <p key={i} className="mt-3 text-text-secondary text-[15.5px] leading-relaxed">{renderInline(p)}</p>)}
          </div></Reveal>
        )}
        {b.cards?.length > 0 && (
          <>
          <div className={b.cards.length > 3
            ? `snap-row max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:-mx-5 max-sm:px-5 max-sm:scroll-px-5 max-sm:pb-2 max-sm:gap-3.5 sm:grid sm:grid-cols-2 ${gridCols} sm:gap-5`
            : `grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4 sm:gap-5`}>
            {b.cards.map((cd, i) => (
              <Reveal key={cd.title} delay={(i % 3) * 0.06} className={b.cards.length > 3 ? "max-sm:shrink-0 max-sm:w-[84%] max-sm:snap-start" : undefined}>
                <Card className="p-5 sm:p-6 h-full">
                  <h3 className="text-[16.5px] font-bold leading-snug">{cd.title}</h3>
                  {[].concat(cd.body || []).map((p, j) => <p key={j} className="text-[14px] text-text-secondary mt-2 leading-relaxed">{renderInline(p)}</p>)}
                </Card>
              </Reveal>
            ))}
          </div>
          {b.cards.length > 3 && <p className="sm:hidden mt-3 text-center text-[12.5px] font-semibold text-text-secondary">Swipe to see all {b.cards.length} →</p>}
          </>
        )}
        {b.points?.length > 0 && (
          <Reveal>
            <div className="rounded-[20px] sm:rounded-[22px] border border-border bg-white p-5 sm:p-7 md:p-9">
              <ul className={b.columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5" : "space-y-3.5"}>
                {b.points.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14.5px] leading-relaxed">
                    <CheckCircle2 size={19} className="text-[#E6AC00] shrink-0 mt-[2px]" aria-hidden /><span>{labelled(t)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
        {(b.note || b.links?.length > 0) && (
          <div className="max-w-[780px] mx-auto text-center mt-7">
            {b.note && <p className="text-[13.5px] text-text-secondary leading-relaxed">{renderInline(b.note)}</p>}
            {(b.links || []).map((l, i) => <p key={i} className="text-[14.5px] mt-2 leading-relaxed">{renderInline(l)}</p>)}
          </div>
        )}
        {b.cta?.label && (
          <div className="text-center mt-8">
            {b.cta.href ? <Button href={b.cta.href} size="lg">{b.cta.label}</Button> : <BookBtn size="lg">{b.cta.label}</BookBtn>}
          </div>
        )}
      </Section>
    );
  };

  // ── Render based on layout ──
  const layout = cfg.layout || DEFAULT_LAYOUT;

  return (
    <>
      {layout.map((item) => {
        if (!item.enabled) return null;
        if (item.id.startsWith("custom-")) {
          const customData = (cfg.customSections || []).find((cs) => cs.id === item.id);
          if (!customData) return null;
          const Renderer = CUSTOM_RENDERERS[customData.type];
          if (!Renderer) return null;
          return <Renderer key={item.id} data={customData} />;
        }
        if (item.id.startsWith("block:")) {
          const key = item.id.slice(6);
          return <React.Fragment key={item.id}>{renderBlock(key, cfg.blocks?.[key])}</React.Fragment>;
        }
        const render = SECTIONS[item.id];
        if (!render) return null;
        return <React.Fragment key={item.id}>{render()}</React.Fragment>;
      })}
      {extraSections.length > 0 && !layout.some((l) => l.id === "extraSections") && <SectionRenderer sections={extraSections} />}
    </>
  );
}