import React from "react";
import { Briefcase, Handshake } from "lucide-react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import { focusRing } from "./shared";

const ICONS = { briefcase: Briefcase, handshake: Handshake };

export default function BusinessEnquiries({ content, onPick }) {
  const c = content.business;
  return (
    <Section id="contact-business" tone="tint">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-center">
        <Reveal>
          <div className="relative">
            <img src={c.image} alt={c.imageAlt} loading="lazy" className="w-full aspect-[4/5] md:aspect-[5/4] object-cover rounded-[24px]" style={{ boxShadow: "0 24px 60px rgba(0,0,0,.16)" }} />
            <div aria-hidden className="absolute -bottom-3 -right-3 w-24 h-24 rounded-2xl bg-primary -z-10" />
          </div>
        </Reveal>
        <div>
          <Reveal><SectionHead id="contact-business" eyebrow={c.eyebrow} title={c.title} description={c.description} /></Reveal>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {c.categories.map((cat, i) => {
              const Icon = ICONS[cat.icon] || Briefcase;
              return (
                <Reveal key={cat.title} delay={0.08 * i}>
                  <div className="py-6 grid sm:grid-cols-[1fr_auto] gap-4 sm:items-center">
                    <div className="flex gap-4">
                      <span className="shrink-0 w-12 h-12 rounded-xl bg-[#111] text-primary flex items-center justify-center"><Icon size={22} aria-hidden /></span>
                      <div>
                        <h3 className="text-[17px] font-extrabold">{cat.title}</h3>
                        <ul className="mt-1.5 text-[13.5px] text-text-secondary leading-relaxed">{cat.points.map((p) => <li key={p}>{p}</li>)}</ul>
                      </div>
                    </div>
                    <button type="button" onClick={() => onPick(cat.subject, cat.prefill)} className={`h-11 px-6 rounded-full bg-primary font-bold text-[14.5px] hover:bg-[#E6AC00] transition-colors whitespace-nowrap ${focusRing}`}>{cat.cta}</button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
