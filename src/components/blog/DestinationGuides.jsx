import React from "react";
import { MapPin } from "lucide-react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import Reveal from "../ui/Reveal";
import BlogImage from "./BlogImage";
import { blogUrl, titleOf, routeEndpoints } from "../../lib/blog";
import { bookRouteHref } from "./routeLinks";

/** Image-led destination panels with varied proportions. Only real destination articles. */
export default function DestinationGuides({ blogs }) {
  if (blogs.length === 0) return null;
  const shape = ["md:col-span-2 aspect-[16/9]", "aspect-[4/5] md:aspect-auto md:row-span-2", "aspect-[4/3]", "aspect-[4/3]", "md:col-span-2 aspect-[16/9]", "aspect-[4/3]"];
  return (
    <Section id="destinations" tone="white">
      <Reveal><SectionHead id="destinations" eyebrow="Destinations" title="Discover Amazing Destinations" description="Find inspiration for your next getaway with destination guides, travel recommendations, and useful journey information." /></Reveal>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[220px]">
        {blogs.slice(0, 6).map((b, i) => {
          const r = routeEndpoints(b);
          return (
            <Reveal key={b.slug} delay={i * 0.05} className={shape[i] + " relative"}>
              <article className="group relative h-full min-h-[220px] overflow-hidden rounded-[8px] bg-[#111]">
                <BlogImage blog={b} width={900} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  {(r?.to || b.category) && <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-primary"><MapPin size={13} aria-hidden />{r?.to || b.category}</span>}
                  <h3 className="mt-1 text-[18px] md:text-[20px] font-extrabold leading-tight"><a href={blogUrl(b)} className="after:absolute after:inset-0 hover:text-primary transition-colors">{titleOf(b)}</a></h3>
                  <p className="mt-2 flex gap-4 text-[13px] font-bold">
                    <span className="text-primary">Explore Guide →</span>
                    {r && <a href={bookRouteHref(r)} className="relative z-10 underline underline-offset-4 hover:text-primary">Book Your Ride</a>}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
