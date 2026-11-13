import React from "react";
import Reveal from "../ui/Reveal";
import { IconWhatsapp } from "../Icons";
import { focusRing } from "./shared";

export default function WhatsAppSupport({ content, href }) {
  const c = content.whatsapp;
  if (!href) return null; // number not configured -> don't render a broken link
  return (
    <section id="contact-whatsapp" aria-labelledby="contact-whatsapp-title" className="bg-white py-10 md:py-14 scroll-mt-28">
      <div className="max-w-[1264px] mx-auto px-5 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-[#111] px-7 py-10 md:px-14 md:py-12 flex flex-col md:flex-row md:items-center gap-8">
            <div aria-hidden className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,213,79,.28), transparent 68%)" }} />
            <span className="relative shrink-0 w-20 h-20 rounded-[22px] bg-primary text-[#111] flex items-center justify-center rotate-[-6deg]"><IconWhatsapp className="w-10 h-10" /></span>
            <div className="relative flex-1">
              <h2 id="contact-whatsapp-title" className="text-white text-[26px] md:text-[34px] font-black tracking-tight leading-tight">{c.title}</h2>
              <p className="mt-3 text-white/70 text-[15.5px] leading-relaxed max-w-[560px]">{c.description}</p>
            </div>
            <a href={href} target="_blank" rel="noopener noreferrer" className={`relative shrink-0 inline-flex items-center justify-center gap-2 h-14 px-9 rounded-full bg-primary text-[#111] font-bold text-[16px] hover:bg-[#E6AC00] hover:scale-[1.03] active:scale-[.97] transition ${focusRing}`}>
              <IconWhatsapp className="w-5 h-5" /> {c.cta}<span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
