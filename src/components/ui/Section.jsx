import React from "react";

const TONES = { white: "bg-white", tint: "bg-[#FFFBEA]", page: "bg-bg", dark: "bg-[#111] text-white" };

/**
 * Standard page section. One place for width, vertical rhythm and the sticky-
 * header scroll offset, so anchors (#contact-form …) never land under the header.
 *   <Section id="faq" tone="tint" narrow> … </Section>
 * Heading ids follow `${id}-title` (see SectionHead `id` prop) for aria-labelledby.
 */
export default function Section({ id, tone = "white", narrow = false, flush = false, className = "", children }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`${TONES[tone] || TONES.white} ${flush ? "" : "py-14 md:py-20"} scroll-mt-28 ${className}`.trim()}>
      <div className={`${narrow ? "max-w-[900px]" : "max-w-[1264px]"} mx-auto px-5 sm:px-6`}>{children}</div>
    </section>
  );
}
