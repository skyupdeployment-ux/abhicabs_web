/**
 * useCmsContent(pageId, defaults) — ONE way to make a page CMS-editable.
 *
 * Code owns the structure and the default copy (src/content/<page>.js).
 * The CMS (Blog Builder → Pages → <pageId>) can override it, using the same
 * section types the builder already offers:
 *
 *   hero  section  →  title, description, image          (overrides defaults.hero)
 *   faq   section  →  items [{question, answer}]          (replaces defaults.faqs)
 *   cta   section  →  heading, description, buttonText    (overrides defaults.cta)
 *   page._layout   →  order / hidden flags of built-in blocks (see `order`)
 *   any other section types (text, image, gallery, …) render after the built-ins
 *
 * Nothing saved in the CMS → the defaults render, exactly like before.
 * Returns plain, merged data — components never touch the CMS directly.
 */
import usePageContent from "./usePageContent";

const pick = (v, fallback) => (v === undefined || v === null || v === "" ? fallback : v);

export default function useCmsContent(pageId, defaults, defaultOrder = []) {
  const cms = usePageContent(pageId);
  const BUILT_IN = new Set(["hero", "faq", "cta"]);

  const content = {
    ...defaults,
    hero: {
      ...defaults.hero,
      title: pick(cms.get("hero", "title"), defaults.hero?.title),
      // a CMS-supplied title replaces the styled default headline, accent included
      accent: cms.get("hero", "title") ? "" : defaults.hero?.accent,
      description: pick(cms.get("hero", "description"), defaults.hero?.description),
      image: pick(cms.get("hero", "image"), defaults.hero?.image),
    },
    faqs: (() => {
      const items = cms.getItems("faq", "items", null);
      const mapped = (items || []).filter((i) => i?.question && i?.answer).map((i) => ({ q: i.question, a: i.answer }));
      return mapped.length ? mapped : defaults.faqs;
    })(),
    cta: {
      ...defaults.cta,
      line1: cms.get("cta", "heading") ? cms.get("cta", "heading") : defaults.cta?.line1,
      line2: cms.get("cta", "heading") ? "" : defaults.cta?.line2,
      description: pick(cms.get("cta", "description"), defaults.cta?.description),
      primaryLabel: pick(cms.get("cta", "buttonText"), defaults.cta?.primaryLabel),
    },
  };

  return {
    content,
    order: cms.getLayout(defaultOrder),          // [{ key, hidden }]
    extraSections: cms.sections.filter((s) => !BUILT_IN.has(s.type)),
    loading: cms.loading,
  };
}
