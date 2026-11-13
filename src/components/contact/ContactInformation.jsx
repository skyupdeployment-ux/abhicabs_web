import React from "react";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import { focusRing } from "./shared";

import { SERVICE_AREA } from "../../data/businessInfo";

export default function ContactInformation({ info, content }) {
  const c = content.info;
  const { phones, email, emailHref, address, directionsHref } = info;
  return (
    <Section id="contact-info" tone="tint">
      <Reveal><SectionHead id="contact-info" eyebrow={c.eyebrow} title={c.title} description={c.description} /></Reveal>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
        {/* Phone — featured */}
        {phones.length > 0 && (
          <Reveal>
            <div className="h-full rounded-[24px] bg-[#111] text-white p-7 md:p-9 relative overflow-hidden">
              <div aria-hidden className="absolute -right-16 -top-16 w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,213,79,.25), transparent 68%)" }} />
              <span className="inline-flex w-12 h-12 rounded-2xl bg-primary text-[#111] items-center justify-center"><Phone size={22} aria-hidden /></span>
              <h3 className="mt-5 text-[22px] font-extrabold">Phone Support</h3>
              <p className="mt-1.5 text-white/65 text-[14.5px] max-w-[380px]">Talk to our team for bookings, trip changes and urgent travel help.</p>
              <div className="mt-6 flex flex-col gap-2">
                {phones.map((p) => (
                  <a key={p.href} href={p.href} className={`group inline-flex items-center justify-between gap-3 rounded-xl border border-white/12 px-4 py-3 text-[19px] md:text-[22px] font-extrabold hover:border-primary hover:text-primary transition-colors ${focusRing}`}>
                    {p.label}<ArrowUpRight size={18} className="opacity-60 group-hover:opacity-100 transition" aria-hidden />
                  </a>
                ))}
              </div>
              <a href={phones[0].href} className={`mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-[#111] font-bold text-[15px] hover:bg-[#E6AC00] transition-colors ${focusRing}`}>
                <Phone size={16} aria-hidden /> Call Now
              </a>
            </div>
          </Reveal>
        )}

        <div className="flex flex-col gap-5">
          {email && (
            <Reveal delay={0.08}>
              <div className="rounded-[18px] bg-white border border-[#EFEFEF] border-l-[5px] border-l-primary p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3"><Mail size={20} className="text-[#E6AC00]" aria-hidden /><h3 className="text-[17px] font-extrabold">Email Support</h3></div>
                <p className="mt-2 text-[14px] text-text-secondary">Write to us with details and documents — we&rsquo;ll reply by email.</p>
                <a href={emailHref} className={`mt-3 block text-[16px] font-bold break-all hover:text-[#E6AC00] ${focusRing}`}>{email}</a>
                <a href={emailHref} className={`mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full border-2 border-[#111] text-[14px] font-bold hover:bg-primary hover:border-primary transition-colors ${focusRing}`}>Send Email</a>
              </div>
            </Reveal>
          )}
          <Reveal delay={0.16}>
            <div className="rounded-[18px] bg-white border border-[#EFEFEF] border-l-[5px] border-l-[#111] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3"><MapPin size={20} className="text-[#E6AC00]" aria-hidden /><h3 className="text-[17px] font-extrabold">{address ? "Office Address" : "Where We Operate"}</h3></div>
              <p className="mt-2 text-[14.5px] text-text leading-relaxed">{address || `Chauffeur-driven cabs across ${SERVICE_AREA}.`}</p>
              {directionsHref ? (
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={`mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full border-2 border-[#111] text-[14px] font-bold hover:bg-primary hover:border-primary transition-colors ${focusRing}`}>Get Directions</a>
              ) : (
                <p className="mt-2 text-[13px] text-text-secondary">Call or message us and we&rsquo;ll help with pickup details.</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
