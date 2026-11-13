import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import { focusRing } from "./shared";

import { SERVICE_AREA } from "../../data/businessInfo";

export default function OfficeLocation({ info, content }) {
  const c = content.office;
  const { address, mapsEmbedSrc, directionsHref, primaryPhone, email, emailHref } = info;
  return (
    <Section id="contact-office" tone="white">
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-stretch">
        <Reveal>
          <SectionHead id="contact-office" eyebrow={c.eyebrow} title={c.title} description={c.description} />
          <div className="mt-8 rounded-[20px] bg-[#FFFBEA] border border-[#EFEFEF] p-6 space-y-5">
            <div className="flex gap-3">
              <MapPin size={20} className="text-[#E6AC00] shrink-0 mt-0.5" aria-hidden />
              <div>
                <div className="text-[13px] font-bold uppercase tracking-wide text-text-secondary">{address ? "Address" : "Service area"}</div>
                <p className="text-[15px] font-semibold mt-0.5">{address || SERVICE_AREA}</p>
              </div>
            </div>
            {primaryPhone && <a href={primaryPhone.href} className={`flex gap-3 items-center text-[15px] font-semibold hover:text-[#E6AC00] ${focusRing}`}><Phone size={18} className="text-[#E6AC00]" aria-hidden />{primaryPhone.label}</a>}
            {email && <a href={emailHref} className={`flex gap-3 items-center text-[15px] font-semibold hover:text-[#E6AC00] break-all ${focusRing}`}><Mail size={18} className="text-[#E6AC00]" aria-hidden />{email}</a>}
            {directionsHref && (
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center w-full h-12 rounded-full bg-primary font-bold text-[15px] hover:bg-[#E6AC00] transition-colors ${focusRing}`}>Get Directions<span className="sr-only"> (opens Google Maps)</span></a>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="min-h-[320px]">
          {mapsEmbedSrc ? (
            <iframe title="Abhi Cabs office location on Google Maps" src={mapsEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="w-full h-full min-h-[340px] md:min-h-[440px] rounded-[24px] border border-[#EFEFEF]" />
          ) : (
            <div className="relative h-full min-h-[320px] md:min-h-[440px] rounded-[24px] overflow-hidden bg-[#111] flex items-end">
              <img src={c.fallbackImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="relative p-7 md:p-9 text-white">
                <div className="text-primary text-[12px] font-black uppercase tracking-[0.2em]">We operate across</div>
                <p className="mt-2 text-[28px] md:text-[34px] font-black leading-tight">{SERVICE_AREA}</p>
                <p className="mt-2 text-white/70 text-[14.5px] max-w-[380px]">Pickups and drops across both regions. Call or message us and we&rsquo;ll sort out the details.</p>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
