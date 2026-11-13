import React from "react";
import { usePageContext } from "vike-react/usePageContext";

/**
 * Global <head> — renders on every page.
 *
 * Per-page overrides (title, description, canonical) are handled via
 * Vike's +config.js per directory or the useConfig() hook.
 *
 * This file provides:
 *  • Viewport, theme-color, favicons, manifest (PWA)
 *  • Default Open Graph / Twitter Card meta (overridden per page)
 *  • Google Search Console verification
 *  • Structured data (JSON-LD) — Organization + WebSite (verified facts only; see the note above STRUCTURED_DATA)
 */

const SITE  = "https://www.abhicabs24x7.com";
const TITLE = "Abhi Cabs | Outstation, Local & Airport Cab Booking";
const DESC  = "Book outstation, one-way, round-trip, local and airport cabs online with Abhi Cabs. Pickups across Karnataka, Andhra Pradesh, Telangana and Maharashtra.";
const IMAGE = `${SITE}/images/Herosection.jpg`;

// Structured data — ONLY facts we can stand behind.
//  • No street address, coordinates, price range or opening hours: none is verified (the previous version carried Bengaluru
//    city-centre coordinates and a guessed locality). Switch Organization → LocalBusiness and add the address once it is confirmed.
//  • No fake SearchAction (the site has no search endpoint with those parameters).
//  • Phone is the one published in the footer.
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "Abhi Cabs",
    alternateName: "AbhiCabs",
    url: SITE,
    logo: `${SITE}/images/abhi-cabs-logo-new.svg`,
    image: IMAGE,
    description: DESC,
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", telephone: "+918096000182", areaServed: "IN", availableLanguage: ["en", "hi"] }],
    areaServed: ["Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra"].map((name) => ({ "@type": "State", name })),
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: "Abhi Cabs",
    publisher: { "@id": `${SITE}/#organization` },
  },
];

export default function HeadDefault() {
  const { urlPathname } = usePageContext();
  const path = (urlPathname || "/").replace(/\/+$/, "");
  const pageUrl = SITE + path; // per-page canonical (was the homepage URL on every page)
  const isArticle = /^\/blogs\/[^/]+$/.test(path);
  return (
    <>
      {/* ── Viewport & PWA ── */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#FFD54F" />
      <link rel="manifest" href="/manifest.json" />

      {/* ── Performance resource hints ──
          Preload the LCP hero so it starts downloading before the JS bundle,
          and warm up connections to the hosts the pages actually hit. */}
      <link rel="preload" as="image" href="/images/Herosection.jpg" fetchPriority="high" />
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.abhicabs24x7.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      <link rel="dns-prefetch" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://checkout.razorpay.com" />

      {/* ── Favicons ── */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
      <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
      <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=3" />

      {/* ── SEO meta ──
          <title>, meta description, og:title, og:description, og:image and the Twitter card are emitted ONCE per page by vike-react
          from each page's config (root defaults in pages/+config.js). They used to be repeated here with the Home page's text,
          so every page shipped two descriptions. Only things vike-react does not emit stay here. The old meta keywords tag is
          gone: search engines ignore it and it listed an outdated service area. */}
      <meta name="author" content="Abhi Cabs" />
      <link rel="canonical" href={pageUrl} />

      {/* ── Open Graph (only the parts vike-react does not generate) ── */}
      <meta property="og:type" content={isArticle ? "article" : "website"} />
      <meta property="og:site_name" content="Abhi Cabs" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:locale" content="en_IN" />

      {/* ── Google Search Console verification ──
          Replace the content value with your actual verification code
          from https://search.google.com/search-console → Settings → Ownership verification → HTML tag */}
      {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" /> */}

      {/* ── Structured data (JSON-LD) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
    </>
  );
}
