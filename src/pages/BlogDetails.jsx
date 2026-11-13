import React, { useEffect, useRef, useState } from "react";
import { render } from "vike/abort";
import { useConfig } from "vike-react/useConfig";
import { Head } from "vike-react/Head";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import useBlogs from "../hooks/useBlogs";
import { blogUrl, titleOf, imageOf, relatedBlogs, neighbours, routeEndpoints, hasTag, categorySlug } from "../lib/blog";
import { cldOptimize } from "../utils/cloudinaryUrl";
import { getEmbedSrc } from "../utils/videoEmbed";
import { buildSchemaGraph } from "../utils/blogSchema";
import { ROUTES } from "../data/siteLinks";
import { bookRouteHref } from "../components/blog/routeLinks";
import ArticleBody from "../components/blog/ArticleBody";
import { READING_CSS } from "../components/blog/readingCss";
import ArticleMeta, { CategoryTag } from "../components/blog/ArticleMeta";
import BlogImage from "../components/blog/BlogImage";
import ShareBar from "../components/blog/ShareBar";
import RelatedArticles from "../components/blog/RelatedArticles";
import SampleBanner from "../components/blog/SampleBanner";
import Breadcrumb from "../components/ui/Breadcrumb";
import ServiceInterlink, { QuickBookStrip } from "../components/ServiceInterlink";

const SITE = "https://www.abhicabs24x7.com";

/** Which Abhi Cabs page/action fits this article. */
function serviceCta(blog) {
  const route = routeEndpoints(blog);
  if (route) return { title: `Travelling ${route.from} to ${route.to}?`, text: "Check the fare and book this route with a verified driver.", label: "Book This Route", href: bookRouteHref(route) };
  if (hasTag(blog, "airport")) return { title: "Need an airport transfer?", text: "On-time pickups and drops with fares shown up front.", label: "Airport Taxi", href: "/services/airport-taxi" };
  if (hasTag(blog, "family")) return { title: "Travelling with family?", text: "Compare comfortable cars for every group size.", label: "See Our Fleet", href: ROUTES.fleet };
  if (hasTag(blog, "corporate", "business")) return { title: "Travel for work?", text: "Corporate accounts with GST invoicing and monthly billing.", label: "Corporate Transport", href: "/services/corporate" };
  if (hasTag(blog, "local", "city")) return { title: "Getting around the city?", text: "Hourly and full-day local rentals.", label: "Local Taxi", href: "/services/local" };
  if (hasTag(blog, "outstation", "weekend", "road trip", "destination")) return { title: "Planning an outstation trip?", text: "One-way and round-trip cabs across Karnataka and Hyderabad.", label: "Outstation Cabs", href: "/services/one-way-outstation" };
  return { title: "Ready for your next journey?", text: "Book a verified driver with transparent fares.", label: "Book a Cab", href: ROUTES.booking };
}

export default function BlogDetails({ vikeSlug }) {
  const { blogs, isSample } = useBlogs();
  const blog = blogs.find((b) => b.slug === vikeSlug);
  if (!blog) throw render(404, "Article not found"); // real 404 status, not a soft "not found" page

  const config = useConfig();
  const url = `${SITE}${blogUrl(blog)}`;
  const img = imageOf(blog);
  const ogImage = img ? (img.startsWith("http") ? img : `${SITE}${img}`) : `${SITE}/images/Herosection.jpg`;
  const imageUrl = (() => { const i = imageOf(blog); return i ? (i.startsWith("http") ? i : `${SITE}${i}`) : `${SITE}/images/Herosection.jpg`; })();
  config({ title: `${blog.title || titleOf(blog)}`, description: blog.description || undefined, image: imageUrl }); // vike-react emits og:title/description/image + twitter card

  const sections = blog.sections?.length ? blog.sections : [];
  const related = relatedBlogs(blog, blogs, 3);
  const { newer, older } = neighbours(blog, blogs);
  const cta = serviceCta(blog);
  const video = getEmbedSrc(blog.videoUrl);
  const [lightbox, setLightbox] = useState(null);

  // TOC from the rendered headings (always matches the ids the body assigned).
  const bodyRef = useRef(null);
  const [toc, setToc] = useState([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    const hs = [...(bodyRef.current?.querySelectorAll("h2[id], h3[id]") || [])].filter((h) => !/^\d+\.\s/.test(h.textContent));
    setToc(hs.length >= 3 ? hs.map((h) => ({ id: h.id, text: h.textContent, sub: h.tagName === "H3" })) : []);
    if (hs.length < 3 || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(v.target.id); }, { rootMargin: "-20% 0px -70% 0px" });
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [blog.slug]);

  // Structured data: the Blog Builder's own schemas when enabled, else BlogPosting. Breadcrumbs always.
  const built = (() => { try { return buildSchemaGraph(blog.schemas) || []; } catch { return []; } })();
  const hasType = (t) => built.some((s) => [].concat(s?.["@type"] || []).includes(t));
  const graph = [
    ...built,
    ...(hasType("BlogPosting") || hasType("Article") ? [] : [{
      "@context": "https://schema.org", "@type": "BlogPosting", headline: titleOf(blog), description: blog.description, image: ogImage,
      datePublished: blog.date ? new Date(blog.date).toISOString?.() : undefined, mainEntityOfPage: url,
      author: { "@type": blog.author ? "Person" : "Organization", name: blog.author || "Abhi Cabs" },
      publisher: { "@type": "Organization", name: "Abhi Cabs", logo: { "@type": "ImageObject", url: `${SITE}/images/abhi-cabs-logo-new.svg` } },
    }]),
    ...(hasType("BreadcrumbList") ? [] : [{
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["Home", SITE], ["Blog", `${SITE}/blogs`], [titleOf(blog), url]].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
    }]),
  ];
  const safeDate = (() => { try { return blog.date ? new Date(blog.date).toISOString() : null; } catch { return null; } })();

  return (
    <article className="bg-white">
      <style>{READING_CSS}</style>
      <Head>
        {safeDate && <meta property="article:published_time" content={safeDate} />}
        {blog.category && <meta property="article:section" content={blog.category} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph.length === 1 ? graph[0] : graph) }} />
      </Head>

      {isSample && <SampleBanner />}

      <header className="bg-[#FFFBEA] border-b border-[#F2E6C9]">
        <div className="max-w-[860px] mx-auto px-5 sm:px-6 pt-8 pb-10 md:pt-12 md:pb-14">
          <Breadcrumb items={[["Home", "/"], ["Blog", ROUTES.blogs], ...(blog.category ? [[blog.category, `/blogs?category=${categorySlug(blog.category)}`]] : []), [titleOf(blog), null]]} />
          <CategoryTag blog={blog} href={`/blogs?category=${categorySlug(blog.category)}`} />
          <h1 className="mt-4 text-[30px] md:text-[46px] font-black tracking-tight leading-[1.1]">{titleOf(blog)}</h1>
          {blog.description && <p className="mt-4 text-[18px] md:text-[20px] text-text-secondary leading-relaxed">{blog.description}</p>}
          <ArticleMeta blog={blog} className="mt-5" />
        </div>
      </header>

      {img && (
        <figure className="max-w-[1100px] mx-auto px-5 sm:px-6 -mt-6 md:-mt-8 relative">
          <div className="relative overflow-hidden rounded-[8px] bg-[#111] shadow-[0_20px_50px_rgba(0,0,0,.15)]">
            <BlogImage blog={blog} width={1400} priority className="w-full aspect-[16/9] object-cover" />
            {video && (
              <button type="button" onClick={() => setLightbox(blog.videoUrl)} aria-label="Play video" className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors">
                <span className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"><Play size={26} fill="#111" aria-hidden /></span>
              </button>
            )}
          </div>
          {blog.imageCaption && <figcaption className="mt-2 text-[13px] text-text-secondary text-center">{blog.imageCaption}</figcaption>}
        </figure>
      )}

      <div className="max-w-[1180px] mx-auto px-5 sm:px-6 py-10 md:py-14 grid lg:grid-cols-[64px_minmax(0,720px)_280px] gap-x-10 justify-center">
        <aside className="hidden lg:block"><div className="sticky top-32"><ShareBar url={url} title={titleOf(blog)} vertical /></div></aside>

        <div>
          {/* Mobile / tablet table of contents */}
          {toc.length > 0 && (
            <details className="lg:hidden mb-8 border border-border rounded-[8px] p-4 bg-[#FAFAFA]">
              <summary className="font-extrabold text-[15px] cursor-pointer">In this article</summary>
              <ul className="mt-3 space-y-2 text-[14.5px]">{toc.map((t) => <li key={t.id} className={t.sub ? "pl-4" : ""}><a href={`#${t.id}`} className="hover:text-[#E6AC00]">{t.text}</a></li>)}</ul>
            </details>
          )}

          <div ref={bodyRef}>
            {sections.length ? <ArticleBody sections={sections} onPlayVideo={setLightbox} /> : <p className="text-text-secondary">This article doesn&rsquo;t have any content yet.</p>}
          </div>

          {/* Service CTA */}
          <aside className="mt-12 bg-[#111] text-white rounded-[8px] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5 justify-between border-l-8 border-l-primary">
            <div><h2 className="text-[20px] md:text-[22px] font-black">{cta.title}</h2><p className="mt-1.5 text-white/70 text-[14.5px]">{cta.text}</p></div>
            <a href={cta.href} className="shrink-0 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-[#111] font-bold hover:bg-[#E6AC00] transition-colors">{cta.label} <ArrowRight size={16} aria-hidden /></a>
          </aside>

          {/* Share (mobile) */}
          <div className="lg:hidden mt-8 pt-6 border-t border-border"><ShareBar url={url} title={titleOf(blog)} /></div>

          {/* Previous / next */}
          {(newer || older) && (
            <nav aria-label="More articles" className="mt-10 grid sm:grid-cols-2 gap-4">
              {older ? <a href={blogUrl(older)} rel="prev" className="group border border-border rounded-[8px] p-5 hover:border-[#111] transition-colors"><span className="text-[12px] font-black uppercase tracking-[0.14em] text-text-secondary inline-flex items-center gap-1.5"><ArrowLeft size={13} aria-hidden /> Previous article</span><span className="mt-1.5 block font-extrabold leading-snug group-hover:text-[#E6AC00]">{titleOf(older)}</span></a> : <span />}
              {newer ? <a href={blogUrl(newer)} rel="next" className="group border border-border rounded-[8px] p-5 hover:border-[#111] transition-colors sm:text-right"><span className="text-[12px] font-black uppercase tracking-[0.14em] text-text-secondary inline-flex items-center gap-1.5 sm:flex-row-reverse"><ArrowRight size={13} aria-hidden /> Next article</span><span className="mt-1.5 block font-extrabold leading-snug group-hover:text-[#E6AC00]">{titleOf(newer)}</span></a> : <span />}
            </nav>
          )}

          <a href={ROUTES.blogs} className="mt-8 inline-flex items-center gap-2 font-bold text-[14.5px] hover:text-[#E6AC00]"><ArrowLeft size={16} aria-hidden /> Back to Blog</a>
        </div>

        {/* Desktop sidebar: TOC */}
        <aside className="hidden lg:block">
          {toc.length > 0 && (
            <nav aria-label="Table of contents" className="sticky top-32">
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-text-secondary mb-3">In this article</p>
              <ul className="border-l-2 border-border space-y-0.5">
                {toc.map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined} className={`block -ml-0.5 border-l-2 py-1.5 text-[13.5px] leading-snug transition-colors ${t.sub ? "pl-7" : "pl-4"} ${active === t.id ? "border-primary font-extrabold text-text" : "border-transparent text-text-secondary hover:text-text"}`}>{t.text}</a></li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </div>

      <RelatedArticles blogs={related} />
      <QuickBookStrip className="bg-[#FAFAFA] border-y border-[#F0F0F0]" />
      <ServiceInterlink title="Book Your Next Trip" className="bg-white" />

      {lightbox && getEmbedSrc(lightbox, { autoplay: true }) && (
        <div role="dialog" aria-modal="true" aria-label="Video" className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/85" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-3xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setLightbox(null)} className="absolute -top-9 right-0 text-white text-sm font-semibold hover:text-primary">✕ Close</button>
            <iframe src={getEmbedSrc(lightbox, { autoplay: true })} allow="autoplay; fullscreen" allowFullScreen className="w-full h-full rounded-xl border-0" title="Video" />
          </div>
        </div>
      )}
    </article>
  );
}
