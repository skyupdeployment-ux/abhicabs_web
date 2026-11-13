import React from "react";
import { ArrowRight } from "lucide-react";
import Section from "../ui/Section";
import Reveal from "../ui/Reveal";
import BlogImage from "./BlogImage";
import ArticleMeta, { CategoryTag } from "./ArticleMeta";
import { blogUrl, titleOf } from "../../lib/blog";

/** Large editorial feature: image bleeds left, headline panel overlaps it. */
export default function FeaturedArticle({ blog }) {
  if (!blog) return null;
  const url = blogUrl(blog);
  return (
    <Section id="featured" tone="tint">
      <Reveal>
        <div className="flex items-center gap-2.5 mb-6"><span className="h-[3px] w-8 bg-primary rounded-full" /><h2 id="featured-title" className="text-[12px] font-black uppercase tracking-[0.2em] text-text-secondary">Featured Story</h2></div>
      </Reveal>
      <Reveal>
        <article className="group relative grid lg:grid-cols-12 items-center">
          <a href={url} aria-label={titleOf(blog)} className="lg:col-span-8 block overflow-hidden rounded-[6px] lg:rounded-[10px]">
            <BlogImage blog={blog} width={1400} priority className="w-full aspect-[16/10] lg:aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </a>
          <div className="lg:col-span-5 lg:col-start-8 lg:-ml-16 relative z-10 -mt-10 mx-4 lg:mx-0 lg:mt-0 bg-white p-6 md:p-9 border-t-4 border-t-primary shadow-[0_20px_50px_rgba(0,0,0,.1)]">
            <CategoryTag blog={blog} href={`/blogs?category=${encodeURIComponent((blog.category || "").toLowerCase().replace(/\s+/g, "-"))}`} />
            <h3 className="mt-4 text-[24px] md:text-[32px] font-black leading-[1.15] tracking-tight"><a href={url} className="hover:text-[#E6AC00] transition-colors">{titleOf(blog)}</a></h3>
            {blog.description && <p className="mt-3 text-[15px] text-text-secondary leading-relaxed line-clamp-4">{blog.description}</p>}
            <ArticleMeta blog={blog} className="mt-4" />
            <a href={url} className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-[#111] font-bold text-[15px] hover:bg-[#E6AC00] transition-colors">Read Full Article <ArrowRight size={16} aria-hidden /></a>
          </div>
        </article>
      </Reveal>
    </Section>
  );
}
