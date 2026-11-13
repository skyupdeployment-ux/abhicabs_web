import React from "react";
import { useConfig } from "vike-react/useConfig";
import { Head } from "vike-react/Head";
import usePageContent from "../hooks/usePageContent";
import useBlogs from "../hooks/useBlogs";
import useBlogQuery from "../hooks/useBlogQuery";
import { categoriesOf, filterBlogs, paginate, isFeatured, isPopular, isDestination, isTip, isRoute, categorySlug } from "../lib/blog";
import BlogHero from "../components/blog/BlogHero";
import FeaturedArticle from "../components/blog/FeaturedArticle";
import BlogCategories from "../components/blog/BlogCategories";
import LatestArticles from "../components/blog/LatestArticles";
import PopularArticles from "../components/blog/PopularArticles";
import DestinationGuides from "../components/blog/DestinationGuides";
import TravelTips from "../components/blog/TravelTips";
import PopularRoutes from "../components/blog/PopularRoutes";
import NewsletterSubscription from "../components/blog/NewsletterSubscription";
import SampleBanner from "../components/blog/SampleBanner";
import EmptyBlog from "../components/blog/EmptyBlog";
import ServiceInterlink, { QuickBookStrip } from "../components/ServiceInterlink";

const SITE = "https://www.abhicabs24x7.com";
const PER_PAGE = 6; // 3×2 grid, every card the same size
const SEO_TITLE = "Abhi Cabs Travel Blog | Travel Tips, Destinations & Road Trips";
const SEO_DESC = "Explore the Abhi Cabs travel blog for destination guides, road-trip inspiration, travel tips, popular routes, and useful travel information.";

const scrollTo = (id) => {
  const el = typeof document !== "undefined" && document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
};

export default function BlogsListing() {
  const config = useConfig();
  config({ title: SEO_TITLE, description: SEO_DESC });
  usePageContent("blogs"); // keeps the CMS page id warm for hero overrides in the Blog Builder

  const { blogs, isSample } = useBlogs();
  const qs = useBlogQuery();
  const { category, q, page } = qs;

  const categories = categoriesOf(blogs);
  const activeCategory = categories.find((c) => c.slug === category);
  const filtered = filterBlogs(blogs, { category, q });
  const result = paginate(filtered, page, PER_PAGE);
  const filtering = !!(category || q);

  // Editorial picks — all derived from real posts / tags, nothing invented.
  const featured = blogs.find(isFeatured) || blogs[0];
  const popularTagged = blogs.filter((b) => isPopular(b) && b.slug !== featured?.slug);
  const popular = (popularTagged.length >= 2 ? popularTagged : blogs.filter((b) => b.slug !== featured?.slug).slice(0, 5)).slice(0, 5);
  const destinations = blogs.filter(isDestination);
  const tips = blogs.filter(isTip);
  const routes = blogs.filter(isRoute);

  const goPage = (p) => { qs.setPage(p); setTimeout(() => scrollTo("latest"), 30); };
  const pickCategory = (c) => { qs.setCategory(c); setTimeout(() => scrollTo("latest"), 30); };
  const allTips = () => { const t = categories.find((c) => /tip/i.test(c.name)); if (t) pickCategory(t.slug); else scrollTo("latest"); };

  // Paginated / filtered views: self-canonical via global Head; keep thin filter pages out of the index.
  const noindex = filtering || page > 1;

  return (
    <>
      <Head>
        {noindex && <meta name="robots" content="noindex, follow" />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Blog", name: "Abhi Cabs Travel Blog", url: `${SITE}/blogs`, description: SEO_DESC }) }} />
      </Head>

      {isSample && <SampleBanner />}
      <BlogHero query={qs.qLive} onQuery={qs.setQuery} onClear={qs.clearSearch} onExplore={() => scrollTo("latest")} />

      {blogs.length === 0 ? <EmptyBlog /> : (
        <>
          {!filtering && page === 1 && <FeaturedArticle blog={featured} />}
          <BlogCategories categories={categories} active={category} total={blogs.length} onSelect={pickCategory} />
          <LatestArticles
            result={result} filtering={filtering} query={q} category={category} categoryName={activeCategory?.name}
            onClear={qs.clearAll} onPage={goPage}
          />
          {!filtering && (
            <>
              <PopularArticles blogs={popular} curated={popularTagged.length >= 2} />
              <QuickBookStrip className="border-y border-[#F0F0F0]" />
              <DestinationGuides blogs={destinations} />
              <TravelTips blogs={tips} onAllTips={allTips} />
              <ServiceInterlink title="Need a Ride?" />
              <PopularRoutes blogs={routes} />
            </>
          )}
        </>
      )}
      <NewsletterSubscription />
    </>
  );
}
