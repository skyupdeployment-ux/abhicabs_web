/**
 * "Ready to publish?" rules for a CMS service page.
 * Layout-aware: only checks sections that are enabled.
 */
const len = (v) => (v || "").trim().length;
const words = (arr) => (arr || []).join(" ").split(/\s+/).filter(Boolean).length;
const range = (n, lo, hi) => (n === 0 ? "todo" : n >= lo && n <= hi ? "ok" : "warn");

export function buildServiceChecklist(c = {}) {
  const layout = c.layout || [];
  const isOn = (id) => { const item = layout.find((l) => l.id === id); return item ? item.enabled : true; };
  const items = [];

  items.push({ id: "svc-f-hero-heading", label: "Page heading", status: len(c.hero?.heading) ? "ok" : "todo", hint: "Add the main heading." });
  items.push({ id: "svc-f-hero-description", label: "Hero description", status: len(c.hero?.description) >= 40 ? "ok" : len(c.hero?.description) ? "warn" : "todo", hint: "One or two sentences (40+ chars)." });
  items.push({ id: "svc-f-hero-image", label: "Hero image", status: len(c.hero?.image) ? "ok" : "todo", hint: "Upload or choose a background image." });

  if (isOn("intro")) {
    const intro = (c.intro?.body || []).filter((t) => len(t));
    const sample = intro.some((t) => /^describe your /i.test(t.trim()));
    items.push({ id: "svc-f-intro-body", label: "Introduction", status: !intro.length ? "todo" : sample ? "warn" : words(intro) < 40 ? "warn" : "ok", hint: sample ? "Replace the sample paragraph." : "Aim for 40+ words." });
  }
  if (isOn("features")) {
    const feat = (c.features?.items || []).filter((f) => len(f.title) && len(f.desc)).length;
    items.push({ id: "svc-sec-features", label: "Highlights", status: feat >= 3 ? "ok" : feat ? "warn" : "todo", hint: "Add at least 3 highlights." });
  }
  if (isOn("faqs")) {
    const faqs = (c.faqs || []).filter((f) => len(f.q) && len(f.a)).length;
    items.push({ id: "svc-sec-faqs", label: "FAQs", status: faqs >= 3 ? "ok" : faqs ? "warn" : "todo", hint: "Add at least 3 FAQs." });
  }

  (c.customSections || []).forEach((cs) => {
    const layoutItem = layout.find((l) => l.id === cs.id);
    if (layoutItem && !layoutItem.enabled) return;
    let hasContent = false;
    switch (cs.type) {
      case "text": hasContent = words(cs.body) > 10; break;
      case "stats": hasContent = (cs.items || []).length >= 2 && cs.items.every((i) => len(i.value)); break;
      case "testimonial": hasContent = (cs.items || []).some((t) => len(t.quote)); break;
      case "gallery": hasContent = (cs.images || []).some((img) => len(img.url)); break;
      case "video": hasContent = len(cs.url); break;
      case "banner": hasContent = len(cs.heading); break;
      case "comparison": hasContent = (cs.rows || []).length > 0 && (cs.columns || []).length > 0; break;
      case "iconList": hasContent = (cs.items || []).some((i) => len(i.title)); break;
      case "checklist": hasContent = (cs.items || []).filter(Boolean).length >= 2; break;
      default: hasContent = true;
    }
    items.push({ id: `svc-sec-${cs.id}`, label: cs.heading || "Custom section", status: hasContent ? "ok" : "warn", hint: "Add content to this section." });
  });

  const mt = len(c.seo?.title), md = len(c.seo?.description);
  items.push({ id: "svc-f-seo-title", label: "SEO title", status: range(mt, 30, 60), hint: mt === 0 ? "Add the Google title." : "Aim for 30–60 characters." });
  items.push({ id: "svc-f-seo-description", label: "Meta description", status: range(md, 120, 160), hint: md === 0 ? "Add the Google description." : "Aim for 120–160 characters." });

  const dirOk = (c.listing || "directory") === "featured" || len(c.group) > 0;
  items.push({ id: "svc-f-group", label: "Directory group", status: dirOk ? "ok" : "warn", hint: "Add a group so the page appears in the link directory." });

  const enabledCount = layout.filter((l) => l.enabled).length;
  if (enabledCount < 4) items.push({ id: "svc-sec-layout", label: "Page sections", status: "warn", hint: `Only ${enabledCount} sections enabled — consider adding more.` });

  return items;
}
