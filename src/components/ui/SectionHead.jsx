import React from "react";

// Brand-aligned section head — yellow underline accent matching brand guidelines.
// `light` for dark backgrounds; `id` wires aria-labelledby from <Section id>.
export default function SectionHead({ eyebrow, title, subheading, description, center = false, light = false, id, className = "" }) {
  return (
    <div className={`max-w-[640px] ${center ? "text-center mx-auto" : ""} ${className}`.trim()}>
      {eyebrow && (
        <div className={`flex items-center gap-2.5 mb-3 ${center ? "justify-center" : ""}`}>
          <span className="h-[3px] w-8 bg-primary rounded-full" />
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${light ? "text-white/60" : "text-text-secondary"}`}>{eyebrow}</span>
        </div>
      )}
      <h2 id={id ? `${id}-title` : undefined} className={`text-[27px] md:text-[38px] font-black tracking-tight leading-tight ${light ? "text-white" : "text-text"}`}>{title}</h2>
      {subheading && <h3 className={`mt-3 text-[17px] md:text-[20px] font-bold leading-snug ${light ? "text-white/85" : "text-text"}`}>{subheading}</h3>}
      {description && <p className={`mt-3 text-[16px] md:text-[17px] leading-relaxed ${light ? "text-white/70" : "text-text-secondary"}`}>{description}</p>}
    </div>
  );
}
