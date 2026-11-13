import React from "react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import Reveal from "../ui/Reveal";
import BlogImage from "./BlogImage";
import { blogUrl, routeEndpoints } from "../../lib/blog";
import { bookRouteHref } from "./routeLinks";

/**
 * Route showcase. Endpoints come only from explicit `from:` / `to:` tags, so nothing
 * is invented; distance/duration are NOT shown (no verified source on the post).
 * Routes without endpoints still link to their guide but get no booking button.
 */
export default function PopularRoutes({ blogs }) {
  if (blogs.length === 0) return null;
  return (
    <Section id="routes" tone="white">
      <Reveal><SectionHead id="routes" eyebrow="Routes" title="Explore Routes and Plan Your Next Journey" description="Discover interesting travel routes, popular destinations, and useful journey information to help plan your next trip." /></Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.slice(0, 6).map((b, i) => {
          const r = routeEndpoints(b);
          return (
            <Reveal key={b.slug} delay={i * 0.05}>
              <article className="group h-full flex flex-col border border-[#EFEFEF] bg-white overflow-hidden rounded-[8px]">
                <a href={blogUrl(b)} aria-label={`Route guide: ${r ? `${r.from} to ${r.to}` : b.headline || b.title}`} className="relative block overflow-hidden">
                  <BlogImage blog={b} width={700} className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                  {r && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                      {/* route line: ● ─ ─ ─ 📍 */}
                      <div className="flex items-center gap-2 text-white text-[13px] font-extrabold">
                        <span>{r.from}</span>
                        <svg aria-hidden viewBox="0 0 120 10" className="flex-1 h-2.5 min-w-8"><circle cx="4" cy="5" r="3.5" fill="#FFD54F" /><line x1="10" y1="5" x2="108" y2="5" stroke="#FFD54F" strokeWidth="2" strokeDasharray="5 5" /><circle cx="116" cy="5" r="3.5" fill="#FFD54F" /></svg>
                        <span>{r.to}</span>
                      </div>
                    </div>
                  )}
                </a>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[16px] font-extrabold leading-snug"><a href={blogUrl(b)} className="hover:text-[#E6AC00] transition-colors">{b.headline || b.title}</a></h3>
                  {b.description && <p className="mt-1.5 text-[13.5px] text-text-secondary line-clamp-2">{b.description}</p>}
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <a href={blogUrl(b)} className="inline-flex items-center h-10 px-5 rounded-full border-2 border-[#111] text-[13.5px] font-bold hover:bg-[#111] hover:text-white transition-colors">Read Route Guide</a>
                    {r && <a href={bookRouteHref(r)} className="inline-flex items-center h-10 px-5 rounded-full bg-primary text-[13.5px] font-bold hover:bg-[#E6AC00] transition-colors">Book This Route</a>}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
