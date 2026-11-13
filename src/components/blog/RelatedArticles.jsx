import React from "react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import BlogImage from "./BlogImage";
import ArticleMeta, { CategoryTag } from "./ArticleMeta";
import { blogUrl, titleOf, categorySlug } from "../../lib/blog";

export default function RelatedArticles({ blogs }) {
  if (!blogs.length) return null;
  return (
    <Section id="related" tone="tint">
      <SectionHead id="related" eyebrow="Keep reading" title="Related Articles" className="mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {blogs.map((b) => (
          <article key={b.slug} className="group">
            <a href={blogUrl(b)} aria-label={titleOf(b)} className="block overflow-hidden rounded-[6px]"><BlogImage blog={b} width={600} className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.05]" /></a>
            <div className="pt-4">
              <CategoryTag blog={b} href={`/blogs?category=${categorySlug(b.category)}`} />
              <h3 className="mt-2.5 text-[17px] font-extrabold leading-snug"><a href={blogUrl(b)} className="hover:text-[#E6AC00] transition-colors">{titleOf(b)}</a></h3>
              <ArticleMeta blog={b} className="mt-2" />
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
