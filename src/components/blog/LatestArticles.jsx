import React from "react";
import { X } from "lucide-react";
import Section from "../ui/Section";
import SectionHead from "../ui/SectionHead";
import BlogImage from "./BlogImage";
import ArticleMeta, { CategoryTag } from "./ArticleMeta";
import BlogPagination from "./BlogPagination";
import { blogUrl, titleOf, categorySlug } from "../../lib/blog";

// Uniform grid: every card has the same image ratio, text rows and height.
function Tile({ b }) {
  return (
    <article className="group flex flex-col h-full">
      <a href={blogUrl(b)} aria-label={titleOf(b)} className="block overflow-hidden rounded-[6px]"><BlogImage blog={b} width={600} className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.05]" /></a>
      <div className="pt-4 flex flex-col flex-1">
        <CategoryTag blog={b} href={`/blogs?category=${categorySlug(b.category)}`} />
        <h3 className="mt-2.5 text-[18px] font-extrabold leading-snug line-clamp-2 min-h-[2.6em]"><a href={blogUrl(b)} className="hover:text-[#E6AC00] transition-colors">{titleOf(b)}</a></h3>
        {b.description && <p className="mt-1.5 text-[13.5px] text-text-secondary leading-relaxed line-clamp-2">{b.description}</p>}
        <ArticleMeta blog={b} className="mt-2.5" />
        <a href={blogUrl(b)} className="mt-auto pt-3 text-[13.5px] font-bold text-[#E6AC00] hover:underline underline-offset-4">Read Article →</a>
      </div>
    </article>
  );
}

export default function LatestArticles({ result, filtering, query, category, categoryName, onClear, onPage }) {
  const { items, page, pages, total } = result;
  return (
    <Section id="latest" tone="white">
      <SectionHead id="latest" eyebrow="Journal" title="Latest from Our Travel Journal" description="Explore our latest travel stories, destination guides, and helpful information for your next journey." />

      {filtering && (
        <div className="mt-6 flex flex-wrap items-center gap-3" aria-live="polite">
          <p className="text-[14px] text-text-secondary">
            <strong className="text-text">{total}</strong> {total === 1 ? "article" : "articles"}
            {categoryName && <> in <strong className="text-text">{categoryName}</strong></>}
            {query && <> matching “<strong className="text-text">{query}</strong>”</>}
          </p>
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border text-[13px] font-bold hover:border-[#111] transition-colors"><X size={14} aria-hidden /> Clear filters</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10 rounded-[10px] bg-[#FFFBEA] border border-[#F2E6C9] p-10 text-center" role="status">
          <p className="text-[18px] font-extrabold">No articles found</p>
          <p className="mt-2 text-[14.5px] text-text-secondary">Try a different search or category.</p>
          <button type="button" onClick={onClear} className="mt-5 h-11 px-6 rounded-full bg-primary font-bold text-[14.5px] hover:bg-[#E6AC00] transition-colors">View all articles</button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12 items-stretch">
          {items.map((b) => <Tile key={b.slug} b={b} />)}
        </div>
      )}

      <BlogPagination page={page} pages={pages} onPage={onPage} />
    </Section>
  );
}
