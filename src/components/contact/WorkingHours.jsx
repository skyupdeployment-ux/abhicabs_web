import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import { SUPPORT_HOURS as H } from "../../data/businessInfo";

export default function WorkingHours({ content }) {
  const c = content.hours;
  const [today, setToday] = useState(null); // after mount, in IST, so SSR and first paint match
  useEffect(() => { try { setToday(new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" }).format(new Date())); } catch { /* ignore */ } }, []);
  const hours = H.allDay ? "Open 24 hours" : `${H.open} – ${H.close}`;
  return (
    <Section id="contact-hours" tone="tint" className="!py-12 md:!py-14">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-center">
        <Reveal><SectionHead id="contact-hours" eyebrow={c.eyebrow} title={c.title} description={c.description} /></Reveal>
        <Reveal delay={0.08}>
          <div className="rounded-[14px] bg-[#111] text-white p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-primary text-[#111] flex items-center justify-center shrink-0"><Clock size={20} aria-hidden /></span>
              <div><div className="text-[19px] font-extrabold">{H.allDay ? "Open 24×7" : hours}</div><p className="text-[13px] text-white/65">{H.note}</p></div>
            </div>
            <ul aria-label="Support days" className="mt-4 grid grid-cols-7 gap-1.5">
              {H.days.map((d) => { const isToday = today === d; return (
                <li key={d} aria-current={isToday ? "date" : undefined} title={`${d}: ${hours}`} className={`text-center rounded-lg py-2 text-[12px] font-bold ${isToday ? "bg-primary text-[#111]" : "bg-white/10 text-white/80"}`}>
                  {d.slice(0, 3)}
                </li>); })}
            </ul>
            <p className="mt-3 text-[12.5px] text-white/55">{c.bookingNote}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
