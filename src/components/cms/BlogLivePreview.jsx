import React, { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import ArticleBody from "../blog/ArticleBody";
import { READING_CSS } from "../blog/readingCss";

/**
 * Live preview of the post, beside the editor. It renders with the SAME article renderer and
 * typography as the public page (ArticleBody + READING_CSS), so what you see here is how the
 * post will look — plus a Google-result preview of the SEO title and description.
 */
export default function BlogLivePreview({ meta, sections, onPlayVideo }) {
  const [device, setDevice] = useState("desktop");
  const empty = !meta.title && sections.length === 0;
  const seoTitle = (meta.metaTitle || meta.title || "Untitled post").trim();
  const host = "www.abhicabs24x7.com";
  const tab = (id, Icon, label) => (
    <button type="button" onClick={() => setDevice(id)} aria-pressed={device === id}
      className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors"
      style={device === id ? { background: "#111", color: "#fff" } : { background: "transparent", color: "#6B7280" }}>
      <Icon size={13} /> {label}
    </button>
  );
  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
      <style>{READING_CSS}</style>
      <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 border-b border-[#E5E7EB] bg-[#FAFAFA]">
        <span className="w-2 h-2 rounded-full" style={{ background: "#059669", animation: "cms-dot-pulse 2s infinite" }} aria-hidden />
        <span className="text-[12.5px] font-extrabold text-[#111827]">Live preview</span>
        <span className="text-[11px] text-[#9CA3AF] hidden xl:inline">updates as you type</span>
        <div className="ml-auto flex items-center gap-1">{tab("desktop", Monitor, "Desktop")}{tab("mobile", Smartphone, "Mobile")}</div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-[#F3F4F6] p-3">
        {/* How it looks in Google */}
        <div className="mb-3 rounded-lg bg-white border border-[#E5E7EB] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#9CA3AF] mb-1.5">In Google</div>
          <div className="text-[11.5px] text-[#4D5156] truncate">{host} › blogs › {meta.slug || "post-slug"}</div>
          <div className="text-[16px] leading-snug" style={{ color: "#1a0dab" }}>{seoTitle}</div>
          <div className="text-[12.5px] text-[#4D5156] line-clamp-2">{meta.description || "Add a meta description to control this text."}</div>
        </div>

        <div className="mx-auto bg-white rounded-lg border border-[#E5E7EB] overflow-hidden transition-[max-width] duration-200" style={{ maxWidth: device === "mobile" ? 390 : "100%" }}>
          {empty ? (
            <div className="px-6 py-16 text-center text-[#9CA3AF]">
              <div className="text-[15px] font-bold text-[#6B7280]">Your post will appear here</div>
              <p className="mt-1 text-[12.5px]">Add a title and start writing — the preview updates as you type.</p>
            </div>
          ) : (
            <article className="px-5 py-6 sm:px-7">
              {meta.category && <span className="inline-block text-[11px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm" style={{ background: "#FFD54F", color: "#111" }}>{meta.category}</span>}
              <h1 className="mt-3 text-[26px] sm:text-[32px] font-black tracking-tight leading-[1.12] text-[#111]">{meta.title || "Untitled post"}</h1>
              {meta.description && <p className="mt-3 text-[16px] leading-relaxed text-[#555]">{meta.description}</p>}
              <div className="mt-3 text-[12.5px] text-[#6B7280] flex flex-wrap items-center gap-2">
                {meta.date && <span>{meta.date}</span>}{meta.date && meta.author && <span aria-hidden>•</span>}{meta.author && <span>{meta.author}</span>}
              </div>
              {meta.heroImage && (
                <figure className="mt-5">
                  <img src={meta.heroImage} alt={meta.imageAlt || ""} title={meta.imageTitle || undefined} className="w-full rounded-lg object-cover" />
                  {meta.imageCaption && <figcaption className="mt-2 text-[12.5px] text-[#6B7280] text-center">{meta.imageCaption}</figcaption>}
                </figure>
              )}
              <ArticleBody sections={sections} onPlayVideo={onPlayVideo} />
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
