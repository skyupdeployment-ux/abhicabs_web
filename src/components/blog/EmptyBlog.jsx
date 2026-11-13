import React from "react";
import Section from "../ui/Section";
import { SERVICE_LINKS, ROUTES } from "../../data/siteLinks";

/** Production state when no posts have been published yet. Honest — no placeholder articles. */
export default function EmptyBlog() {
  return (
    <Section tone="tint">
      <div className="max-w-[640px] mx-auto text-center">
        <span aria-hidden className="inline-block h-[3px] w-10 bg-primary rounded-full" />
        <h2 className="mt-4 text-[28px] md:text-[34px] font-black tracking-tight">Our first travel stories are on the way</h2>
        <p className="mt-3 text-text-secondary text-[16px] leading-relaxed">We&rsquo;re putting together destination guides, route tips and travel advice. Until they&rsquo;re published, you can plan your trip right now.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={ROUTES.booking} className="inline-flex items-center h-12 px-7 rounded-full bg-primary font-bold hover:bg-[#E6AC00] transition-colors">Book a Cab</a>
          <a href={ROUTES.services} className="inline-flex items-center h-12 px-7 rounded-full border-2 border-[#111] font-bold hover:bg-[#111] hover:text-white transition-colors">Our Services</a>
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-text-secondary">
          {SERVICE_LINKS.map((s) => <li key={s.href}><a href={s.href} className="hover:text-[#E6AC00]">{s.label}</a></li>)}
        </ul>
      </div>
    </Section>
  );
}
