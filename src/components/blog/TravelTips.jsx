import React from "react";
import { ShieldCheck, Luggage, Users, Plane, CloudRain, Route } from "lucide-react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import Reveal from "../ui/Reveal";
import BlogImage from "./BlogImage";
import { blogUrl, titleOf } from "../../lib/blog";

const ICONS = [ShieldCheck, Plane, Users, CloudRain, Luggage, Route];

export default function TravelTips({ blogs, onAllTips }) {
  if (blogs.length === 0) return null;
  const [main, ...rest] = blogs;
  return (
    <Section id="tips" tone="tint">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Reveal><SectionHead id="tips" eyebrow="Tips" title="Travel Smarter with Abhi Cabs" description="Practical advice for safer, smoother and more comfortable journeys." /></Reveal>
        <button type="button" onClick={onAllTips} className="h-11 px-6 rounded-full border-2 border-[#111] font-bold text-[14px] hover:bg-[#111] hover:text-white transition-colors">Explore All Tips</button>
      </div>
      <div className="mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <Reveal>
          <article className="group relative overflow-hidden rounded-[8px] bg-[#111] h-full min-h-[360px]">
            <BlogImage blog={main} width={1000} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.04]" />
            <div className="relative h-full flex flex-col justify-end p-6 md:p-9 bg-gradient-to-t from-black/90 via-black/30 to-transparent min-h-[360px]">
              <span className="w-fit bg-primary text-[#111] text-[11px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm">Featured tip</span>
              <h3 className="mt-3 text-white text-[24px] md:text-[30px] font-black leading-tight"><a href={blogUrl(main)} className="after:absolute after:inset-0">{titleOf(main)}</a></h3>
              {main.description && <p className="mt-2 text-white/75 text-[14.5px] max-w-[460px] line-clamp-2">{main.description}</p>}
              <span className="mt-4 text-primary font-bold text-[14px]">Read More →</span>
            </div>
          </article>
        </Reveal>
        <ul className="grid gap-3 content-start">
          {rest.slice(0, 5).map((b, i) => { const Icon = ICONS[i % ICONS.length]; return (
            <Reveal key={b.slug} delay={i * 0.05} as="li">
              <a href={blogUrl(b)} className="group flex gap-4 items-start bg-white border-l-4 border-l-primary p-4 hover:shadow-md transition-shadow">
                <span className="w-10 h-10 rounded-lg bg-[#FFFBEA] flex items-center justify-center shrink-0"><Icon size={19} className="text-[#E6AC00]" aria-hidden /></span>
                <span><span className="block text-[15.5px] font-extrabold leading-snug group-hover:text-[#E6AC00] transition-colors">{titleOf(b)}</span>
                {b.description && <span className="block mt-1 text-[13px] text-text-secondary line-clamp-2">{b.description}</span>}
                <span className="mt-1.5 inline-block text-[13px] font-bold text-[#E6AC00]">Read More →</span></span>
              </a>
            </Reveal>); })}
        </ul>
      </div>
    </Section>
  );
}
