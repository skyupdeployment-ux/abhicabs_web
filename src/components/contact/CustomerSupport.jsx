import React from "react";
import { CalendarCheck, Route, LifeBuoy, ArrowRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import { focusRing } from "./shared";
import { ROUTES } from "../../data/siteLinks";

const ICONS = { route: Route, lifebuoy: LifeBuoy };

export default function CustomerSupport({ content, onPick }) {
  const c = content.support, f = c.featured;
  return (
    <Section id="contact-support" tone="tint">
      <Reveal><SectionHead id="contact-support" eyebrow={c.eyebrow} title={c.title} description={c.description} /></Reveal>
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5">
        <Reveal>
          <div className="h-full relative overflow-hidden rounded-[24px] bg-white border border-[#EFEFEF] p-7 md:p-9">
            <div aria-hidden className="absolute right-0 top-0 h-full w-2 bg-primary" />
            <span className="inline-flex w-14 h-14 rounded-2xl bg-primary items-center justify-center"><CalendarCheck size={26} aria-hidden /></span>
            <h3 className="mt-5 text-[24px] font-extrabold">{f.title}</h3>
            <p className="mt-2 text-text-secondary text-[15px] max-w-[460px]">{f.description}</p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[14.5px]">
              {f.points.map((p) => (<li key={p} className="flex gap-2"><span aria-hidden className="mt-2 w-1.5 h-1.5 rounded-full bg-[#E6AC00] shrink-0" />{p}</li>))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => onPick(f.subject)} className={`inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary font-bold text-[15px] hover:bg-[#E6AC00] transition-colors ${focusRing}`}>Get Booking Help <ArrowRight size={16} aria-hidden /></button>
              <a href={ROUTES.myBooking} className={`inline-flex items-center h-12 px-6 rounded-full border-2 border-[#111] font-bold text-[15px] hover:bg-[#111] hover:text-white transition-colors ${focusRing}`}>Find My Booking</a>
            </div>
          </div>
        </Reveal>
        <div className="flex flex-col gap-5">
          {c.options.map((o, i) => {
            const Icon = ICONS[o.icon] || LifeBuoy;
            return (
              <Reveal key={o.title} delay={0.08 * (i + 1)}>
                <button type="button" onClick={() => onPick(o.subject)} className={`group w-full text-left rounded-[20px] bg-[#111] text-white p-6 hover:-translate-y-0.5 hover:shadow-xl transition ${focusRing}`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex w-11 h-11 rounded-xl bg-primary text-[#111] items-center justify-center"><Icon size={21} aria-hidden /></span>
                    <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-[18px] font-extrabold">{o.title}</h3>
                  <ul className="mt-2 text-[13.5px] text-white/70 space-y-1">{o.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
