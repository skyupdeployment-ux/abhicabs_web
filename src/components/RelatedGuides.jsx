import React from "react";
import Section from "./ui/Section";
import SectionHead from "./ui/SectionHead";
import { GUIDES_BY_MODE } from "../content/seoLinks";
import { SEO_ARTICLES } from "../data/seoArticles";

/** "Helpful guides" — 3 contextual links from a service page to the matching blog articles (renders nothing if none apply). */
export default function RelatedGuides({ mode }) {
  const slugs = GUIDES_BY_MODE[mode || ""] || [];
  const guides = slugs.map((s) => SEO_ARTICLES.find((a) => a.slug === s)).filter(Boolean);
  if (!guides.length) return null;
  return (
    <Section id="guides" tone="page" className="!py-12">
      <SectionHead id="guides" eyebrow="Guides" title="Helpful guides before you book" className="mb-6" />
      <ul className="grid gap-3 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <a href={`/blogs/${g.slug}`} className="block h-full rounded-[14px] border border-border bg-white p-5 hover:border-primary hover:shadow-md transition-all">
              <span className="block text-[15px] font-extrabold leading-snug">{g.headline}</span>
              <span className="mt-2 block text-[13px] text-text-secondary line-clamp-2">{g.description}</span>
              <span className="mt-3 inline-block text-[13px] font-bold text-[#E6AC00]">Read the guide →</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
