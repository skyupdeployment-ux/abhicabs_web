import React from "react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import Reveal from "../ui/Reveal";
import BlogImage from "./BlogImage";
import ArticleMeta from "./ArticleMeta";
import { blogUrl, titleOf, readingMinutes } from "../../lib/blog";

/**
 * Numbered reading list. `editorial` = true when the posts are hand-picked via the
 * `popular` tag. No view counts exist, so none are shown and nothing claims "most read".
 */
export default function PopularArticles({ blogs, curated }) {
  if (blogs.length === 0) return null;
  const [top, ...rest] = blogs;
  return (
    <Section id="popular" tone="tint">
      <Reveal><SectionHead id="popular" eyebrow={curated ? "Reader favourites" : "Editor's picks"} title={curated ? "Popular Reads" : "Worth Reading Next"} description={curated ? "Hand-picked stories our readers keep coming back to." : "More stories from our travel journal."} /></Reveal>
      <div className="mt-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
        <Reveal>
          <article className="group relative overflow-hidden rounded-[8px] bg-[#111]">
            <a href={blogUrl(top)} aria-label={titleOf(top)} className="block"><BlogImage blog={top} width={900} className="w-full aspect-[4/3] object-cover opacity-80 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-65" /></a>
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
              <span className="text-primary text-[64px] font-black leading-none">01</span>
              <h3 className="mt-1 text-white text-[22px] md:text-[26px] font-black leading-tight pointer-events-auto"><a href={blogUrl(top)} className="hover:text-primary transition-colors">{titleOf(top)}</a></h3>
              <ArticleMeta blog={top} light className="mt-2" />
            </div>
          </article>
        </Reveal>
        <ol className="divide-y divide-border border-y border-border self-start">
          {rest.map((b, i) => (
            <Reveal key={b.slug} delay={i * 0.05} as="li">
              <a href={blogUrl(b)} className="group flex gap-4 items-center py-5">
                <span aria-hidden className="text-[34px] font-black text-[#E6AC00]/70 w-12 shrink-0 leading-none">{String(i + 2).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-extrabold leading-snug group-hover:text-[#E6AC00] transition-colors">{titleOf(b)}</h3>
                  <p className="mt-1 text-[12.5px] text-text-secondary">{[b.category, readingMinutes(b) && `${readingMinutes(b)} min read`].filter(Boolean).join(" • ")}</p>
                </div>
                <BlogImage blog={b} width={200} className="w-20 h-20 object-cover rounded-[6px] shrink-0" />
              </a>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
