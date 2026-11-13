import React from "react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";

/** Category navigation (pills with live counts). Only categories that contain articles are listed. */
export default function BlogCategories({ categories, active, total, onSelect }) {
  if (categories.length === 0) return null;
  const pill = (isActive) => `shrink-0 inline-flex items-center gap-2 h-12 px-5 rounded-full border-2 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6AC00] ${isActive ? "bg-[#111] border-[#111] text-white" : "bg-white border-border hover:border-[#111]"}`;
  const count = (n, isActive) => <span className={`text-[12px] rounded-full px-2 py-0.5 ${isActive ? "bg-primary text-[#111]" : "bg-[#FFFBEA] text-text-secondary"}`}>{n}</span>;
  return (
    <Section id="categories" tone="white" className="!py-10 md:!py-12">
      <SectionHead id="categories" eyebrow="Browse" title="Explore by Category" className="mb-6" />
      <div role="group" aria-label="Filter articles by category" className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none]">
        <button type="button" aria-pressed={!active} onClick={() => onSelect("")} className={pill(!active)}>All Articles {count(total, !active)}</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" aria-pressed={active === c.slug} onClick={() => onSelect(c.slug)} className={pill(active === c.slug)}>{c.name} {count(c.count, active === c.slug)}</button>
        ))}
      </div>
    </Section>
  );
}
