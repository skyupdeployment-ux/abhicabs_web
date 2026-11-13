// src/utils/schema.js
// Schema.org templates for the Blog Builder.
// Each schema can be edited two ways:
//   • "default" → edit the schema's key→value pairs in input boxes
//   • "upload"  → paste raw JSON / a <script type="application/ld+json"> block,
//                 then Save to load those values into the Default fields.
// Object schemas keep the FULL pasted object as their editable data, so nothing
// is lost (e.g. an added "name"); list schemas (FAQ/Breadcrumb) use repeatable
// item rows. Shared by the builder (UI + preview) and the live page (+Head).

// Parse JSON-LD, tolerating two things that commonly break pasted schema:
//   • curly "smart" quotes  →  straight quotes
//   • missing commas between properties / array items on separate lines
export function parseJsonLd(raw = "") {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim();
  const m = s.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (m) s = m[1].trim();
  s = s
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/`/g, "");
  try { return JSON.parse(s); } catch { /* tolerant pass below */ }
  let fixed = s
    .replace(/(["\d\]}]|true|false|null)(\s*\r?\n\s*)(["[{])/g, "$1,$2$3")
    .replace(/,(\s*[}\]])/g, "$1");
  try { return JSON.parse(fixed); } catch { return null; }
}

const clone = (o) => JSON.parse(JSON.stringify(o));

// ── Schema definitions ────────────────────────────────────────────────────────
// kind "object": the editable `data` IS the JSON-LD object (template below).
// kind "list":   repeatable rows built into a list-type schema.
export const SCHEMA_DEFS = [
  {
    id: "faq",
    label: "FAQ Schema",
    kind: "list",
    addLabel: "Add question",
    itemFields: [
      { key: "name", label: "Question", type: "text", placeholder: "Which is better, Shorts or Reels?" },
      { key: "text", label: "Answer", type: "textarea", placeholder: "Answer text…" },
    ],
    newItem: () => ({ name: "", text: "" }),
    defaultItems: [{ name: "", text: "" }],
    build: (d) => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (d.items || [])
        .filter((i) => i.name || i.text)
        .map((i) => ({
          "@type": "Question",
          name: i.name,
          acceptedAnswer: { "@type": "Answer", text: i.text },
        })),
    }),
  },

  {
    id: "blog",
    label: "Blog Schema",
    kind: "object",
    template: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": "" },
      headline: "",
      image: "",
      author: { "@type": "Organization", name: "Novara Nature Estates", url: "https://www.novaranatureestates.com/" },
      publisher: { "@type": "Organization", name: "Novara Nature Estates", logo: { "@type": "ImageObject", url: "https://www.novaranatureestates.com/images/logo.svg" } },
      datePublished: "",
      dateModified: "",
    },
  },

  {
    id: "breadcrumb",
    label: "Breadcrumb Schema",
    kind: "list",
    addLabel: "Add breadcrumb",
    itemFields: [
      { key: "name", label: "Name", type: "text", placeholder: "Blogs" },
      { key: "item", label: "URL", type: "text", placeholder: "https://…/blogs" },
    ],
    newItem: () => ({ name: "", item: "" }),
    defaultItems: [{ name: "", item: "" }],
    build: (d) => ({
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      itemListElement: (d.items || [])
        .filter((i) => i.name || i.item)
        .map((i, idx) => ({ "@type": "ListItem", position: String(idx + 1), name: i.name, item: i.item })),
    }),
  },

  {
    id: "review",
    label: "Review Rating Schema",
    kind: "object",
    template: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "",
        reviewCount: "",
        bestRating: "",
        worstRating: "",
      },
    },
  },

  {
    id: "video",
    label: "Video Schema",
    kind: "object",
    template: {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "",
      description: "",
      thumbnailUrl: "",
      uploadDate: "",
      duration: "",
      contentUrl: "",
      embedUrl: "",
    },
  },

  {
    id: "product",
    label: "Product Schema",
    kind: "object",
    template: {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: "",
      image: "",
      description: "",
      brand: { "@type": "Brand", name: "" },
      sku: "",
      offers: {
        "@type": "Offer",
        url: "",
        priceCurrency: "",
        price: "",
        priceValidUntil: "",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "",
        bestRating: "",
        worstRating: "",
        ratingCount: "",
      },
    },
  },
];

// default build for object schemas = the data object itself
export function buildSchemaObject(def, data) {
  if (def.kind === "list") return def.build(data || {});
  return data || clone(def.template);
}

// Empty config keyed by schema id.
export function initSchemas() {
  const out = {};
  for (const def of SCHEMA_DEFS) {
    out[def.id] = {
      enabled: false,
      mode: "default",
      data: def.kind === "list"
        ? { items: (def.defaultItems || []).map((x) => ({ ...x })) }
        : clone(def.template),
      json: "",
    };
  }
  return out;
}

// Merge a saved config onto the template set (so new schema types still appear
// when editing an older post).
export function normalizeSchemas(saved) {
  const base = initSchemas();
  if (!saved || typeof saved !== "object") return base;
  for (const def of SCHEMA_DEFS) {
    if (saved[def.id]) base[def.id] = { ...base[def.id], ...saved[def.id] };
  }
  return base;
}

// ── Sanitizer ─────────────────────────────────────────────────────────────────
// Cleans JSON-LD right before it's injected, fixing three common problems that
// crept into stored schema data:
//   • image/url doubled with the site domain
//     ("https://www.novaranatureestates.comhttps://res.cloudinary.com/…")
//   • dates without a time/timezone ("2026-01-01" → full ISO 8601)
//   • Organization/Person author missing a "url"
const SANITIZE_SITE = "https://www.novaranatureestates.com";

// Strip an accidentally-prepended site domain from an otherwise-absolute URL.
function fixSchemaUrl(u) {
  if (typeof u !== "string") return u;
  const m = u.trim().match(/^https?:\/\/(?:www\.)?novaranatureestates\.com(https?:\/\/.+)$/i);
  return m ? m[1] : u.trim();
}

function fixMediaValue(v) {
  if (typeof v === "string") return fixSchemaUrl(v);
  if (Array.isArray(v)) return v.map(fixMediaValue);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = k === "url" ? fixSchemaUrl(val) : sanitizeSchema(val);
    return o;
  }
  return v;
}

// Turn "2026-01-01" / "Apr 8, 2026" into a valid ISO 8601 datetime with a zone.
// Also repairs a colon typed where ISO wants a "T" ("2026-06-28:13:41:25+05:30").
function fixSchemaDate(d) {
  if (typeof d !== "string" || !d.trim()) return d;
  let s = d.trim().replace(/^(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2})/, "$1T$2");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s;  // full datetime → keep (preserves timezone)
  const t = Date.parse(s);
  if (Number.isNaN(t)) return d;                           // leave unparseable values alone
  return new Date(t).toISOString();                        // e.g. 2026-01-01T00:00:00.000Z
}

export function sanitizeSchema(node) {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (["image", "logo", "thumbnailUrl", "contentUrl"].includes(k)) out[k] = fixMediaValue(v);
    else if (["datePublished", "dateModified", "uploadDate"].includes(k)) out[k] = fixSchemaDate(v);
    else if (["url", "@id", "item"].includes(k) && typeof v === "string") out[k] = fixSchemaUrl(v);
    else out[k] = sanitizeSchema(v);
  }
  // Recommended-but-missing author url (removes Google's "Missing field url").
  if (out.author && typeof out.author === "object" && !Array.isArray(out.author) &&
      !out.author.url && (out.author["@type"] === "Organization" || out.author["@type"] === "Person")) {
    out.author = { ...out.author, url: `${SANITIZE_SITE}/` };
  }
  return out;
}

// Turn the editor config into an array of JSON-LD objects (enabled schemas only).
export function buildSchemaGraph(schemas = {}) {
  const out = [];
  for (const def of SCHEMA_DEFS) {
    const cfg = schemas[def.id];
    if (!cfg || !cfg.enabled) continue;
    if (cfg.mode === "upload") {
      const parsed = parseJsonLd(cfg.json);
      if (parsed) Array.isArray(parsed) ? out.push(...parsed) : out.push(parsed);
    } else {
      try { out.push(buildSchemaObject(def, cfg.data || {})); } catch { /* skip */ }
    }
  }
  return out.map(sanitizeSchema);
}

// Live-page entry point. New posts use blog.schemas; old posts get a minimal
// BlogPosting so nothing regresses.
export function buildBlogSchema(blog = {}) {
  if (blog.schemas) {
    const graph = buildSchemaGraph(blog.schemas);
    if (graph.length) return graph;
  }
  const SITE = "https://www.novaranatureestates.com";
  const date = blog.date && !Number.isNaN(Date.parse(blog.date))
    ? new Date(blog.date).toISOString() : undefined;
  return [{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.headline || blog.title || "",
    description: blog.description || "",
    ...((blog.heroImage || blog.image) ? { image: fixSchemaUrl(blog.heroImage || blog.image) } : {}),
    ...(date ? { datePublished: date, dateModified: date } : {}),
    author: { "@type": "Organization", name: blog.author || "Novara Nature Estates", url: `${SITE}/` },
    publisher: {
      "@type": "Organization",
      name: "Novara Nature Estates",
      logo: { "@type": "ImageObject", url: `${SITE}/images/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blogs/${blog.slug || ""}` },
  }].map(sanitizeSchema);
}

export function schemaGraphToString(schemas) {
  return JSON.stringify(buildSchemaGraph(schemas), null, 2);
}

// Map a pasted/parsed JSON-LD object into the editable `data` shape.
//  • list schemas  → pull rows out of mainEntity / itemListElement
//  • object schemas→ keep the whole object (so every key, incl. extras, shows)
export function extractToData(id, json) {
  if (!json || typeof json !== "object") return null;
  const str = (v) => (v == null ? "" : String(v));
  if (id === "faq") {
    return { items: (json.mainEntity || []).map((q) => ({
      name: str(q && q.name),
      text: str(q && q.acceptedAnswer && q.acceptedAnswer.text),
    })) };
  }
  if (id === "breadcrumb") {
    return { items: (json.itemListElement || []).map((li) => ({
      name: str(li && li.name),
      item: str(li && li.item),
    })) };
  }
  return json; // object schemas keep the full parsed object
}