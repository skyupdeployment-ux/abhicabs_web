import React from "react";

/** items: [[label, href|null], …] — last item (href null) is the current page. */
export default function Breadcrumb({ items, light = false, className = "" }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[13.5px] mb-4 ${light ? "text-white/65" : "text-text-secondary"} ${className}`}>
      {items.map(([label, href], i) => (
        <React.Fragment key={label}>
          {i > 0 && <span aria-hidden className={light ? "text-white/35" : ""}>/</span>}
          {href ? (
            <a href={href} className={`font-semibold ${light ? "hover:text-white" : "hover:text-[#E6AC00]"}`}>{label}</a>
          ) : (
            <span aria-current="page" className={light ? "text-white font-semibold" : "font-semibold text-text"}>{label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
