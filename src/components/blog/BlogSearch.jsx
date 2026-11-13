import React from "react";
import { Search, X } from "lucide-react";

/** Controlled search box (debounce lives in useBlogQuery). */
export default function BlogSearch({ value, onChange, onClear, id = "blog-search", dark = false }) {
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative w-full">
      <label htmlFor={id} className="sr-only">Search articles</label>
      <Search size={18} aria-hidden className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-white/50" : "text-text-secondary"}`} />
      <input
        id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search articles, destinations, tips…"
        autoComplete="off"
        className={`w-full h-14 rounded-full pl-12 pr-12 text-[15px] outline-none transition ${dark ? "bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-primary" : "bg-white border border-border focus:border-[#E6AC00]"} focus:ring-2 focus:ring-primary/40`}
      />
      {value && (
        <button type="button" onClick={onClear} aria-label="Clear search" className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center ${dark ? "text-white hover:bg-white/15" : "hover:bg-black/5"} focus-visible:outline-2 focus-visible:outline-primary`}>
          <X size={17} aria-hidden />
        </button>
      )}
    </form>
  );
}
