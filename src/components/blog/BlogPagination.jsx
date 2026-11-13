import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Windowed page list: 1 … 4 5 [6] 7 8 … 20. Hidden when there is one page. */
export function pageWindow(page, pages) {
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push("…" + n); out.push(n); });
  return out;
}

export default function BlogPagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const base = "min-w-11 h-11 px-3 inline-flex items-center justify-center rounded-full text-[14px] font-bold border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6AC00]";
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2 flex-wrap">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page" className={`${base} border-border hover:border-[#111] disabled:opacity-35 disabled:cursor-not-allowed`}><ChevronLeft size={18} aria-hidden /></button>
      {pageWindow(page, pages).map((n) => typeof n === "string"
        ? <span key={n} aria-hidden className="px-1 text-text-secondary">…</span>
        : <button key={n} type="button" onClick={() => onPage(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined} className={`${base} ${n === page ? "bg-primary border-primary text-[#111]" : "border-border hover:border-[#111]"}`}>{n}</button>)}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page" className={`${base} border-border hover:border-[#111] disabled:opacity-35 disabled:cursor-not-allowed`}><ChevronRight size={18} aria-hidden /></button>
    </nav>
  );
}
