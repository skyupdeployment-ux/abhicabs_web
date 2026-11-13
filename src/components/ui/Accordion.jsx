import React, { useId, useState } from "react";
import { Plus } from "lucide-react";

/**
 * Accessible accordion used by every FAQ on the site (contact, services, service pages).
 * Buttons + aria-expanded/controls, keyboard operable, smooth height via grid-rows,
 * motion removed for prefers-reduced-motion. items: [{ q, a }]. One open at a time.
 */
export default function Accordion({ items, defaultOpen = 0, tone = "white", className = "" }) {
  const base = useId();
  const [open, setOpen] = useState(defaultOpen);
  const tint = tone === "tint" ? "bg-[#FFFBEA]" : "bg-[#FAFAFA]";
  return (
    <div className={`rounded-[18px] overflow-hidden border border-border border-b-0 bg-white ${className}`.trim()}>
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        const id = `${base}-${i}`;
        return (
          <div key={q} className={`border-b border-border transition-colors ${isOpen ? tint : "bg-white"}`}>
            <h3>
              <button type="button" id={`${id}-b`} aria-expanded={isOpen} aria-controls={`${id}-p`} onClick={() => setOpen(isOpen ? -1 : i)}
                className={`w-full flex items-center justify-between gap-4 text-left px-5 py-5 text-[15.5px] font-bold border-l-4 transition-colors ${isOpen ? "border-l-primary" : "border-l-transparent"} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#E6AC00]`}>
                {q}
                <Plus size={20} aria-hidden className={`shrink-0 text-[#E6AC00] transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`} />
              </button>
            </h3>
            <div id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden"><p className="px-5 pb-5 pl-6 text-[14.5px] text-text-secondary leading-relaxed">{a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
