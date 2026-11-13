import React from "react";
import { formatDate, readingMinutes } from "../../lib/blog";

/** category · date · reading time · author — each only when it really exists. */
export default function ArticleMeta({ blog, light = false, className = "" }) {
  const mins = readingMinutes(blog);
  const parts = [blog.date && formatDate(blog.date), mins && `${mins} min read`, blog.author].filter(Boolean);
  return (
    <p className={`text-[12.5px] font-medium ${light ? "text-white/70" : "text-text-secondary"} ${className}`}>
      {parts.map((t, i) => <React.Fragment key={t}>{i > 0 && <span aria-hidden className="mx-2 opacity-50">•</span>}{t}</React.Fragment>)}
    </p>
  );
}

export function CategoryTag({ blog, href, light = false }) {
  if (!blog.category) return null;
  const cls = `inline-block w-fit self-start text-[11px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm ${light ? "bg-primary text-[#111]" : "bg-primary text-[#111]"}`;
  return href ? <a href={href} className={`${cls} relative z-10 hover:bg-[#E6AC00]`}>{blog.category}</a> : <span className={cls}>{blog.category}</span>;
}
