import EmojiIcon from "./ui/EmojiIcon";
/**
 * SectionRenderer.jsx — Renders CMS page sections as live website components.
 *
 * Each section type from the CMS Page Editor has a matching renderer here.
 * Sections are rendered in order with their per-section settings
 * (background color, text color, padding, visibility).
 */

import React from "react";
import Button from "./ui/Button";
import { getEmbedSrc } from "../utils/videoEmbed";
import { cldOptimize } from "../utils/cloudinaryUrl";

const PADDING_MAP = {
  none: "0", small: "24px 0", normal: "48px 0",
  large: "72px 0", xl: "96px 0",
};

function sectionStyle(section) {
  return {
    background: section._bgColor || undefined,
    color: section._textColor || undefined,
    padding: PADDING_MAP[section._padding] || "48px 0",
    ...(section._sectionId ? { id: section._sectionId } : {}),
  };
}

function Wrap({ section, children }) {
  if (section._hidden) return null;
  return (
    <section style={sectionStyle(section)} className={section._className || ""}>
      <div style={{ maxWidth: 1264, margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </section>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────
function HeroSection({ s }) {
  if (s._hidden) return null;
  return (
    <section style={{
      background: s.image
        ? `linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.7)),url(${s.image}) center/cover`
        : s._bgColor || "linear-gradient(135deg,#1B1B1B,#0a0a0a)",
      padding: "clamp(56px,8vw,96px) 24px",
      textAlign: "center",
      color: s._textColor || "#fff",
    }} id={s._sectionId || undefined} className={s._className || ""}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {s.title && <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{s.title}</h1>}
        {s.accent && <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, margin: "4px 0 0", color: "#F5A623", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{s.accent}</h1>}
        {s.description && <p style={{ fontSize: "clamp(14px,1.5vw,17px)", opacity: 0.75, marginTop: 16, maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>{s.description}</p>}
        {s.ctaText && (
          <div style={{ marginTop: 24 }}>
            <a href={s.ctaLink || "/#booking"} style={{ display: "inline-block", padding: "14px 32px", background: "linear-gradient(135deg,#F5A623,#E09000)", color: "#fff", borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(245,166,35,0.3)" }}>
              {s.ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Text Block ───────────────────────────────────────────────────────
function TextSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {s.heading && <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>{s.heading}</h2>}
        {s.body && <div style={{ fontSize: 15.5, lineHeight: 1.8, color: s._textColor || "#374151" }} dangerouslySetInnerHTML={{ __html: s.body }} />}
      </div>
    </Wrap>
  );
}

// ── Image ────────────────────────────────────────────────────────────
function ImageSection({ s }) {
  const maxW = { small: 400, medium: 600, large: 800, full: "100%" }[s.width] || "100%";
  return (
    <Wrap section={s}>
      <div style={{ textAlign: "center" }}>
        {s.url ? (
          <img src={cldOptimize(s.url, { width: 1200 })} alt={s.alt || ""} loading="lazy" decoding="async" style={{ maxWidth: maxW, width: "100%", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "block", margin: "0 auto" }} />
        ) : (
          <div style={{ height: 200, background: "#F3F4F6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>No image</div>
        )}
        {s.caption && <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, fontStyle: "italic" }}>{s.caption}</p>}
      </div>
    </Wrap>
  );
}

// ── Video ────────────────────────────────────────────────────────────
function VideoSection({ s }) {
  const src = getEmbedSrc(s.embedUrl);
  return (
    <Wrap section={s}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {src ? (
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <iframe src={src} loading="lazy" style={{ width: "100%", aspectRatio: "16/9", border: "none" }} allowFullScreen title={s.caption || "Video"} />
          </div>
        ) : (
          <div style={{ height: 200, background: "#F3F4F6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>No video URL</div>
        )}
        {s.caption && <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>{s.caption}</p>}
      </div>
    </Wrap>
  );
}

// ── Stats ────────────────────────────────────────────────────────────
function StatsSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(24px,5vw,56px)", flexWrap: "wrap" }}>
        {(s.items || []).map((item, i) => (
          <div key={i} style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#F5A623", letterSpacing: "-0.03em" }}>{item.value}</div>
            <div style={{ fontSize: 14, color: s._textColor ? `${s._textColor}99` : "#6B7280", fontWeight: 600, marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

// ── Features ─────────────────────────────────────────────────────────
function FeaturesSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
        {(s.items || []).map((f, i) => (
          <div key={i} style={{ background: s._bgColor ? "rgba(255,255,255,0.08)" : "#fff", border: s._bgColor ? "none" : "1px solid #E5E7EB", borderRadius: 18, padding: 24, textAlign: "center" }}>
            {f.image && <img src={f.image} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", margin: "0 auto 12px" }} />}
            {f.icon && <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><EmojiIcon glyph={f.icon} size={34} color="#F5A623" /></div>}
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>{f.title}</h3>
            {f.description && <p style={{ fontSize: 14, color: s._textColor ? `${s._textColor}99` : "#6B7280", lineHeight: 1.6, margin: 0 }}>{f.description}</p>}
          </div>
        ))}
      </div>
    </Wrap>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────
function CtaSection({ s }) {
  const isPrimary = s.style === "primary";
  return (
    <Wrap section={s}>
      <div style={{
        background: isPrimary ? "linear-gradient(135deg,#1B1B1B,#0a0a0a)" : s.style === "outline" ? "#fff" : "#F3F4F6",
        borderRadius: 22, padding: "clamp(32px,4vw,52px)", textAlign: "center",
        border: s.style === "outline" ? "2px solid #E5E7EB" : "none",
        position: "relative", overflow: "hidden",
      }}>
        {isPrimary && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 30%, rgba(245,166,35,0.06) 0%, transparent 50%)" }} />}
        <div style={{ position: "relative" }}>
          {s.heading && <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, color: isPrimary ? "#fff" : "#111", margin: 0 }}>{s.heading}</h2>}
          {s.description && <p style={{ fontSize: 15, color: isPrimary ? "rgba(255,255,255,0.65)" : "#6B7280", marginTop: 8, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>{s.description}</p>}
          {s.buttonText && (
            <a href={s.buttonLink || "#"} style={{ display: "inline-block", marginTop: 20, padding: "14px 32px", background: isPrimary ? "linear-gradient(135deg,#F5A623,#E09000)" : "#1B1B1B", color: "#fff", borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              {s.buttonText}
            </a>
          )}
        </div>
      </div>
    </Wrap>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────
function FaqSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {(s.items || []).map((q, i) => (
          <details key={i} style={{ borderBottom: "1px solid #E5E7EB", padding: "16px 0" }}>
            <summary style={{ fontSize: 16, fontWeight: 700, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {q.question || "Question?"} <span style={{ fontSize: 20, color: "#9CA3AF" }}>+</span>
            </summary>
            <p style={{ fontSize: 14.5, color: s._textColor ? `${s._textColor}99` : "#6B7280", marginTop: 10, lineHeight: 1.7 }}>{q.answer}</p>
          </details>
        ))}
      </div>
    </Wrap>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────
function GallerySection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {(s.images || []).map((img, i) => (
          img.url ? <img key={i} src={cldOptimize(img.url, { width: 800 })} alt={img.alt || ""} loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 14 }} />
            : <div key={i} style={{ aspectRatio: "4/3", background: "#F3F4F6", borderRadius: 14 }} />
        ))}
      </div>
    </Wrap>
  );
}

// ── Links ────────────────────────────────────────────────────────────
function LinksSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        {(s.items || []).map((lnk, i) => (
          <a key={i} href={lnk.url || "#"} target={lnk.url?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
            style={{ background: s._bgColor ? "rgba(255,255,255,0.08)" : "#fff", border: s._bgColor ? "none" : "1px solid #E5E7EB", borderRadius: 16, padding: "16px 24px", minWidth: 200, textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lnk.label}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{lnk.description || lnk.url}</div>
          </a>
        ))}
      </div>
    </Wrap>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────
function TestimonialSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {(s.items || []).map((t, i) => (
          <div key={i} style={{ background: s._bgColor ? "rgba(255,255,255,0.06)" : "#fff", border: s._bgColor ? "none" : "1px solid #E5E7EB", borderRadius: 18, padding: 24 }}>
            <p style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.7, marginBottom: 16, color: s._textColor || "#374151" }}>"{t.quote}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {t.image ? <img src={t.image} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}><EmojiIcon glyph="👤" size={22} color="#9CA3AF" /></div>}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                {t.role && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{t.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

// ── Team ─────────────────────────────────────────────────────────────
function TeamSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
        {(s.items || []).map((m, i) => (
          <div key={i} style={{ textAlign: "center", background: s._bgColor ? "rgba(255,255,255,0.06)" : "#fff", border: s._bgColor ? "none" : "1px solid #E5E7EB", borderRadius: 18, padding: 24 }}>
            {m.image ? <img src={m.image} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }} /> : <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F3F4F6", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}><EmojiIcon glyph="👤" size={34} color="#9CA3AF" /></div>}
            <div style={{ fontSize: 16, fontWeight: 800 }}>{m.name}</div>
            {m.role && <div style={{ fontSize: 13, color: "#F5A623", fontWeight: 600, marginTop: 2 }}>{m.role}</div>}
            {m.bio && <p style={{ fontSize: 13, color: s._textColor ? `${s._textColor}99` : "#6B7280", marginTop: 8, lineHeight: 1.5 }}>{m.bio}</p>}
          </div>
        ))}
      </div>
    </Wrap>
  );
}

// ── Banner ───────────────────────────────────────────────────────────
function BannerSection({ s }) {
  const colors = { info: ["#EFF6FF","#1E40AF"], success: ["#ECFDF5","#065F46"], warning: ["#FFFBEB","#92400E"], error: ["#FEF2F2","#991B1B"], promo: ["linear-gradient(135deg,#FFFBEB,#FEF3C7)","#92400E"] };
  const [bg, clr] = colors[s.style] || colors.info;
  return (
    <Wrap section={s}>
      <div style={{ background: bg, padding: "18px 24px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, border: "1px solid rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: clr }}>{s.text}</span>
        {s.linkText && <a href={s.linkUrl || "#"} style={{ fontSize: 14, fontWeight: 700, color: "#F5A623", textDecoration: "none" }}>{s.linkText} →</a>}
      </div>
    </Wrap>
  );
}

// ── Accordion ────────────────────────────────────────────────────────
function AccordionSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {(s.items || []).map((item, i) => (
          <details key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
            <summary style={{ padding: "14px 18px", fontSize: 15, fontWeight: 700, cursor: "pointer", background: "#FAFAFA" }}>{item.title}</summary>
            <div style={{ padding: "12px 18px 16px", fontSize: 14.5, lineHeight: 1.7, color: s._textColor || "#374151" }} dangerouslySetInnerHTML={{ __html: item.content }} />
          </details>
        ))}
      </div>
    </Wrap>
  );
}

// ── Embed ────────────────────────────────────────────────────────────
function EmbedSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {s.code && <div dangerouslySetInnerHTML={{ __html: s.code }} />}
        {s.caption && <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>{s.caption}</p>}
      </div>
    </Wrap>
  );
}

// ── Social Links ─────────────────────────────────────────────────────
function SocialSection({ s }) {
  return (
    <Wrap section={s}>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        {(s.items || []).map((item, i) => (
          <a key={i} href={item.url || "#"} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 50, background: s._bgColor ? "rgba(255,255,255,0.1)" : "#F3F4F6", color: s._textColor || "#374151", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            {item.platform}
          </a>
        ))}
      </div>
    </Wrap>
  );
}

// ── Divider ──────────────────────────────────────────────────────────
function DividerSection({ s }) {
  if (s._hidden) return null;
  return (
    <div style={{ padding: "12px 24px", maxWidth: 1264, margin: "0 auto" }}>
      {s.style === "dots" ? <div style={{ textAlign: "center", color: "#D1D5DB", letterSpacing: 8, fontSize: 18 }}>• • •</div>
        : s.style === "gradient" ? <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#F5A623,transparent)", borderRadius: 2 }} />
        : s.style === "space" ? <div style={{ height: 48 }} />
        : <div style={{ height: 1, background: "#E5E7EB" }} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN RENDERER — maps section type to component
// ══════════════════════════════════════════════════════════════════════

const RENDERERS = {
  hero: HeroSection, text: TextSection, image: ImageSection, video: VideoSection,
  stats: StatsSection, features: FeaturesSection, cta: CtaSection, faq: FaqSection,
  gallery: GallerySection, links: LinksSection, testimonial: TestimonialSection,
  team: TeamSection, banner: BannerSection, accordion: AccordionSection,
  embed: EmbedSection, social: SocialSection, divider: DividerSection,
};

export default function SectionRenderer({ sections }) {
  if (!sections || sections.length === 0) return null;
  return (
    <>
      {sections.filter(s => !s._hidden).map((section, idx) => {
        const Comp = RENDERERS[section.type];
        if (!Comp) return <div key={idx} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>Unknown section: {section.type}</div>;
        return <Comp key={section.id || idx} s={section} />;
      })}
    </>
  );
}
