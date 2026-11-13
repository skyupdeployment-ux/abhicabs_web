import React from "react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import Accordion from "../ui/Accordion";
import { scrollToId, focusRing } from "./shared";

/** Fills the `{office}` placeholder from whether an office address is configured. */
export function resolveFaqs(content, address) {
  const o = address ? content.officeFaq.withAddress.replace("{address}", address) : content.officeFaq.without;
  return content.faqs.map((f) => ({ ...f, a: f.a.replace("{office}", o) }));
}

export default function ContactFAQs({ content, info }) {
  const h = content.faqsHeading;
  return (
    <Section id="contact-faq" tone="white" narrow>
      <Reveal><SectionHead id="contact-faq" center eyebrow={h.eyebrow} title={h.title} description={h.description} /></Reveal>
      <Reveal delay={0.08}><Accordion className="mt-10" tone="tint" items={resolveFaqs(content, info.address)} /></Reveal>
      <p className="mt-7 text-center text-[14.5px] text-text-secondary">
        Still have questions?{" "}
        <button type="button" onClick={() => scrollToId("contact-form")} className={`font-bold text-text underline decoration-primary decoration-2 underline-offset-4 hover:text-[#E6AC00] ${focusRing}`}>Contact Our Team.</button>
      </p>
    </Section>
  );
}
