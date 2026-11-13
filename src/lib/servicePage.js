/**
 * Fixed template for CMS-created sub-service pages (/services/<slug>).
 *
 * The CMS no longer builds the layout: a service page is stored as plain CONTENT
 * (`page._template = "service"`, `page._content = {...}`) and always rendered by the
 * same <ServiceLanding> template as the built-in Local / Airport / Outstation pages.
 * Editors only fill in text, images, lists and FAQs.
 *
 * Shared by the CMS form (creation + defaults) and the public page (rendering).
 */
import { SERVICE_LINKS } from "../data/siteLinks";
import { getIcon, iconName } from "../components/ui/iconMap";
import { SERVICE_DEFAULTS, BUILT_IN_SLUGS } from "../content/serviceDefaults";

export const TRIP_MODES = [
  { value: "one-way", label: "Show booking form — opens on One Way" },
  { value: "round-trip", label: "Show booking form — opens on Round Trip" },
  { value: "local", label: "Show booking form — opens on Local" },
  { value: "airport", label: "Show booking form — opens on Airport" },
  { value: "", label: "No booking form — show an enquiry button instead" },
];

export const FEATURE_ICONS = ["shield", "price", "car", "phone", "clock", "pin", "wallet", "headset", "users", "plane", "route", "luggage", "building", "navigation", "repeat", "calendar", "map", "user", "globe"];

// Where a page is listed besides its own URL.
export const LISTINGS = [
  { value: "directory", label: "Link directory only (best for many city pages)" },
  { value: "featured", label: "Featured — header menu, footer, Services cards & related links" },
  { value: "nav-only", label: "Header nav dropdown only (More menu)" },
  { value: "footer-only", label: "Footer links only" },
  { value: "hidden", label: "Hidden — URL works but not listed anywhere" },
];

/** Fresh content for a new page. Every field is editable; nothing structural is. */
export function newServiceContent(label, mode = "one-way", group = "") {
  const lower = label.toLowerCase();
  return {
    mode, group, listing: "directory", icon: "car",
    hero: { eyebrow: label, heading: label, description: `Book ${lower} with Abhi Cabs — transparent fares, verified drivers and support from our team.`, image: "/images/dashboard-pov.jpg" },
    intro: { eyebrow: label, heading: `About our ${lower}`, image: "/images/airport-family-full.jpg", body: [`Describe your ${lower} here — what it covers, who it's for and why travellers choose Abhi Cabs.`], bullets: ["Verified, rated drivers", "Transparent fares", "AC sedans & SUVs"] },
    features: { heading: `Why ${lower} with Abhi Cabs`, items: [
      { icon: "shield", title: "Verified drivers", desc: "KYC-verified, background-checked chauffeurs." },
      { icon: "price", title: "Transparent pricing", desc: "See the exact fare before you book." },
      { icon: "car", title: "Clean, comfortable cars", desc: "A well-maintained fleet for every trip." },
      { icon: "phone", title: "Real people to help", desc: "Reach our team before, during and after your ride." },
    ] },
    pricing: { heading: `Understand ${lower} costs`, description: "What goes into your fare.", points: ["Distance or package chosen", "Vehicle category", "Tolls & parking at actuals"] },
    how: { heading: `How booking ${lower} works`, steps: [
      { title: "Enter your trip", desc: "Add pickup, drop and time." },
      { title: "See the fare", desc: "Get the full price up front." },
      { title: "Choose a vehicle", desc: "Pick the car that fits." },
      { title: "Confirm & ride", desc: "A verified driver arrives on time." },
    ] },
    routes: [],
    faqs: [
      { q: `How do I book ${lower}?`, a: "Enter your trip details, get an instant quote and confirm — it takes under a minute." },
      { q: "What vehicles are available?", a: "Sedans, SUVs and larger vehicles for groups, in both AC and non-AC." },
      { q: "Is the pricing transparent?", a: "Yes — you see the full fare before booking, with no hidden charges." },
    ],
    cta: { line1: "Ready", line2: "to ride?", description: "Book your cab in under a minute." },
    seo: { title: `${label} | Abhi Cabs`, description: `Book ${lower} with Abhi Cabs — transparent fares, verified drivers and support from our team.` },
    layout: [
      { id: "hero", enabled: true },
      { id: "intro", enabled: true },
      { id: "features", enabled: true },
      { id: "pricing", enabled: true },
      { id: "routes", enabled: !!mode },
      { id: "how", enabled: true },
      { id: "faqs", enabled: true },
      { id: "relatedGuides", enabled: true },
      { id: "exploreServices", enabled: true },
      { id: "serviceDirectory", enabled: true },
      { id: "cta", enabled: true },
    ],
    customSections: [],
  };
}

/** Stored content → the `cfg` ServiceLanding expects. Tolerates missing fields. */
export function toServiceCfg(slug, c) {
  const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  const mode = c.mode || null;
  return {
    slug, mode, enquirySubject: c.enquirySubject || "corporate", primaryLabel: c.primaryLabel || undefined,
    hero: { eyebrow: c.hero?.eyebrow || c.hero?.heading || slug, heading: c.hero?.heading || slug, subheading: c.hero?.subheading, description: c.hero?.description || "", image: c.hero?.image || "/images/dashboard-pov.jpg", alt: c.hero?.alt },
    intro: { eyebrow: c.intro?.eyebrow || "", heading: c.intro?.heading || "", image: c.intro?.image || "/images/airport-family-full.jpg", alt: c.intro?.alt, body: list(c.intro?.body), bullets: list(c.intro?.bullets), items: list(c.intro?.items).filter((it) => it.heading) },
    features: { heading: c.features?.heading || "Why choose us", subheading: c.features?.subheading, intro: c.features?.intro, items: list(c.features?.items).map((f) => ({ Icon: getIcon(f.icon), title: f.title, desc: f.desc })) },
    pricing: { ...(c.pricing || {}), heading: c.pricing?.heading || "Pricing", description: c.pricing?.description || "", points: list(c.pricing?.points) },
    how: { heading: c.how?.heading || "How it works", subheading: c.how?.subheading, ctaLabel: c.how?.ctaLabel, steps: list(c.how?.steps) },
    coverage: c.coverage || null, tips: c.tips || null, blocks: c.blocks || null, faqHeading: c.faqHeading, routesHeading: c.routesHeading,
    routes: list(c.routes).filter((r) => r.from && r.to),
    faqs: list(c.faqs).filter((f) => f.q && f.a).map((f) => [f.q, f.a]),
    related: [...SERVICE_LINKS.map((s) => ({ label: s.short, href: s.href })).slice(0, 4), { label: "All Services", href: "/services" }],
    cta: { line1: c.cta?.line1 || "Ready", line2: c.cta?.line2 || "to ride?", subheading: c.cta?.subheading, description: c.cta?.description || "", buttonLabel: c.cta?.buttonLabel },
    layout: c.layout || null,
    customSections: (c.customSections || []).map((cs) => ({ ...cs })),
  };
}

export const isTemplatePage = (page) => page?._template === "service" && page?._content;

export const slugifyName = (s) => (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** "Car rental in {city}" + ["Bangalore","Delhi"] → ["Car rental in Bangalore","Car rental in Delhi"]. */
export function namesForCities(pattern, cities) {
  const base = (pattern || "").trim();
  if (!cities.length) return base ? [base] : [];
  return cities.map((c) => (base.includes("{city}") ? base.replace(/\{city\}/gi, c) : `${base} in ${c}`));
}

/**
 * All CMS service pages grouped for the link directory:
 *   [{ group: "Airport Taxi Services", links: [{ label, href }] }]
 * Groups keep the order they were created in; ungrouped pages go under "More Services".
 */
export function buildDirectory(allPages = {}, { exclude } = {}) {
  const groups = new Map();
  Object.entries(allPages).forEach(([id, pg]) => {
    if (!pg || !(pg._service || pg._template) || id === exclude) return;
    const g = (pg._content?.group || "").trim() || "More Services";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({ label: pg._label || id, href: `/services/${pg._slug || id}` });
  });
  return [...groups.entries()].map(([group, links]) => ({ group, links }));
}

/** Code defaults (one of the five built-in services) → editable CMS content. */
export function cfgToContent(slug) {
  const d = SERVICE_DEFAULTS[slug];
  if (!d) return null;
  return {
    mode: d.mode || "", group: "", listing: "featured", icon: d.cardIcon || "car",
    primaryLabel: d.primaryLabel, faqHeading: d.faqHeading, routesHeading: d.routesHeading,
    hero: { eyebrow: d.hero.eyebrow, heading: d.hero.heading, subheading: d.hero.subheading, description: d.hero.description, image: d.hero.image, alt: d.hero.alt },
    intro: { eyebrow: d.intro.eyebrow, heading: d.intro.heading, image: d.intro.image, alt: d.intro.alt, body: [...(d.intro.body || [])], bullets: [...(d.intro.bullets || [])], items: (d.intro.items || []).map((x) => ({ ...x })) },
    features: { heading: d.features.heading, subheading: d.features.subheading, items: d.features.items.map((f) => ({ icon: f.icon || iconName(f.Icon), title: f.title, desc: f.desc })) },
    pricing: { ...d.pricing, points: [...(d.pricing.points || [])] },
    how: { heading: d.how?.heading || "", subheading: d.how?.subheading, steps: (d.how?.steps || []).map((x) => ({ ...x })) },
    coverage: d.coverage ? JSON.parse(JSON.stringify(d.coverage)) : undefined,
    tips: d.tips ? JSON.parse(JSON.stringify(d.tips)) : undefined,
    routes: (d.routes || []).map((r) => ({ from: r.from, to: r.to })),
    faqs: (d.faqs || []).map(([q, a]) => ({ q, a })),
    cta: { ...d.cta },
    seo: { ...d.seo },
    layout: d.layout ? d.layout.map((l) => ({ ...l })) : [
      { id: "hero", enabled: true },
      { id: "intro", enabled: true },
      { id: "features", enabled: true },
      { id: "pricing", enabled: true },
      { id: "routes", enabled: !!(d.routes?.length) },
      { id: "how", enabled: true },
      { id: "faqs", enabled: true },
      { id: "relatedGuides", enabled: true },
      { id: "exploreServices", enabled: true },
      { id: "serviceDirectory", enabled: true },
      { id: "cta", enabled: true },
    ],
    customSections: [],
  };
}
export { BUILT_IN_SLUGS };

/**
 * Pages shown in menus / footer / cards / related links:
 *  - the five built-ins (CMS override wins; set to "directory" there to unlist it), then
 *  - every CMS page whose listing is "featured".
 * → [{ slug, href, label, short, mode, icon, desc, points, custom }]
 */
export function featuredServices(allPages = {}) {
  const cms = (slug) => Object.entries(allPages).find(([id, p]) => (id === slug || p?._slug === slug) && isTemplatePage(p))?.[1];
  const row = (slug, page, base) => {
    const c = page?._content;
    return {
      slug, href: `/services/${slug}`, custom: !!page && !base, fromCms: !!page,
      label: page?._label || base?.label || slug, short: page?._label || base?.short || slug,
      mode: c ? (c.mode || null) : (base?.mode ?? null), icon: c?.icon || base?.icon || "car",
      desc: c?.hero?.description || base?.desc || "", points: (c?.intro?.bullets || base?.points || []).slice(0, 3),
    };
  };
  const out = [];
  BUILT_IN_SLUGS.forEach((slug) => {
    const page = cms(slug);
    if (page && page._content?.listing === "directory") return; // unlisted by the editor
    const d = SERVICE_DEFAULTS[slug];
    const sl = SERVICE_LINKS.find((l) => l.href === `/services/${slug}`);
    out.push(row(slug, page, { label: sl?.label || d.hero.eyebrow, short: sl?.short || d.hero.eyebrow, mode: d.mode || null, icon: d.cardIcon, desc: d.hero.description, points: d.intro.bullets }));
  });
  Object.entries(allPages).forEach(([id, p]) => {
    const slug = p?._slug || id;
    if (!isTemplatePage(p) || BUILT_IN_SLUGS.includes(slug) || p._content?.listing !== "featured") return;
    out.push(row(slug, p, null));
  });
  return out;
}
