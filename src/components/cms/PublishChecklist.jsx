import React from "react";

/**
 * "Ready to publish?" checklist for the blog editor. Guidance only — it never blocks publishing,
 * but every open item has a Fix link that jumps to (and focuses) the field to complete.
 *   status: "ok" | "warn" (filled, but outside the ideal range) | "todo"
 */
export function buildChecklist(meta, wordCount) {
  const len = (v) => (v || "").trim().length;
  const mt = len(meta.metaTitle), md = len(meta.description);
  const range = (n, lo, hi) => (n === 0 ? "todo" : n >= lo && n <= hi ? "ok" : "warn");
  return [
    { id: "cms-title", label: "Headline", status: len(meta.title) ? "ok" : "todo", hint: "Add a headline at the top." },
    { id: "cms-slug", label: "URL (permalink)", status: len(meta.slug) ? "ok" : "todo", hint: "Created from the headline — edit it with the pencil icon." },
    { id: "cms-meta-title", label: "SEO title", status: range(mt, 30, 60), hint: mt === 0 ? "Add the title shown in Google." : mt < 30 ? "A little short — aim for 30–60 characters." : "A little long — aim for 30–60 characters." },
    { id: "cms-meta-desc", label: "Meta description", status: range(md, 120, 160), hint: md === 0 ? "Add the summary shown under the title in Google." : md < 120 ? "A little short — aim for 120–160 characters." : "A little long — aim for 120–160 characters." },
    { id: "cms-featured-image", label: "Featured image", status: meta.heroImage ? "ok" : "todo", hint: "Upload an image for the top of the post and the Blog page." },
    ...(meta.heroImage ? [{ id: "cms-hero-alt", label: "Image alt text", status: len(meta.imageAlt) ? "ok" : "todo", hint: "Describe the image (helps SEO and accessibility)." }] : []),
    { id: "cms-category", label: "Category", status: len(meta.category) ? "ok" : "todo", hint: "Choose where it appears on the Blog page." },
    { id: "cms-body", label: "Article content", status: wordCount >= 100 ? "ok" : wordCount > 0 ? "warn" : "todo", hint: wordCount === 0 ? "Write the article." : `Only ${wordCount} words so far — longer posts rank better (aim for 300+).` },
  ];
}

const ICON = { ok: ["#059669", "✓"], warn: ["#D97706", "!"], todo: ["#9CA3AF", "○"] };

/** Generic "Ready to publish?" panel: items = [{ id, label, status, hint }], onFix(id) jumps to the field. */
export function ChecklistPanel({ items, onFix, title = "Ready to publish?", className = "mb-3" }) {
  const done = items.filter((i) => i.status === "ok").length;
  return (
    <div className={`${className} rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]`}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#EDEDED]">
        <span className="text-[12px] font-extrabold text-[#111827]">{title}</span>
        <span className="text-[11px] font-bold" style={{ color: done === items.length ? "#059669" : "#6B7280" }}>{done} of {items.length} done</span>
      </div>
      <div className="h-1 bg-[#EDEDED]"><div className="h-1 transition-all" style={{ width: `${(done / items.length) * 100}%`, background: done === items.length ? "#059669" : "#F5A623" }} /></div>
      <ul className="px-3 py-2 space-y-1.5">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 text-[12px]">
            <span className="mt-px w-4 h-4 shrink-0 rounded-full text-[10px] font-black flex items-center justify-center text-white" style={{ background: ICON[i.status][0] }} aria-hidden>{ICON[i.status][1]}</span>
            <span className="flex-1 min-w-0">
              <span className="font-semibold text-[#374151]">{i.label}</span>
              {i.status !== "ok" && <span className="block text-[11px] text-[#9CA3AF] leading-snug">{i.hint}</span>}
            </span>
            {i.status !== "ok" && <button type="button" onClick={() => onFix(i.id)} className="shrink-0 text-[11px] font-bold text-[#B8860B] hover:underline">Fix</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PublishChecklist({ meta, wordCount, onFix }) {
  return <ChecklistPanel items={buildChecklist(meta, wordCount)} onFix={onFix} />;
}
