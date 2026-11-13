import React from "react";

/**
 * Blog "structure" fields for the CMS editor — category + where the post appears on the
 * public Blog page. Everything is stored in the existing `category` and `tags` fields, so
 * there is no schema change; src/lib/blog.js reads the same tags on the public page:
 *   featured · popular · destination · tips · route (+ from:<city> / to:<city>)
 * Props: category, tags (comma string), categories (existing, for suggestions), onChange(patch).
 */
const SUGGESTED = ["Travel Tips", "Destinations", "Road Trips", "Travel Guides"];
const FLAGS = [
  { tag: "featured", label: "Featured story", hint: "Big editorial feature at the top of the Blog page (the newest featured post is used)." },
  { tag: "popular", label: "Popular read", hint: "Shown in “Popular Reads”. Hand-picked — no view counts are claimed." },
  { tag: "destination", label: "Destination guide", hint: "Shown in “Discover Amazing Destinations”." },
  { tag: "tips", label: "Travel tip", hint: "Shown in “Travel Smarter with Abhi Cabs”." },
  { tag: "route", label: "Route guide", hint: "Shown in “Explore Routes”. Add From and To to get a “Book This Route” button." },
];
const MANAGED = new Set(["featured", "popular", "destination", "destinations", "tips", "tip", "travel-tips", "route", "routes"]);

const split = (s) => String(s || "").split(",").map((t) => t.trim()).filter(Boolean);
const lc = (t) => t.toLowerCase();
const isManaged = (t) => MANAGED.has(lc(t)) || /^(from|to):/i.test(t);
const valueOf = (arr, key) => (arr.find((t) => lc(t).startsWith(key + ":")) || "").slice(key.length + 1).trim();

export default function BlogStructureFields({ category, tags, categories = [], onChange }) {
  const arr = split(tags);
  const has = (tag) => arr.some((t) => lc(t) === tag || (tag === "destination" && lc(t) === "destinations") || (tag === "tips" && ["tip", "travel-tips"].includes(lc(t))) || (tag === "route" && lc(t) === "routes"));
  const extras = arr.filter((t) => !isManaged(t));
  const from = valueOf(arr, "from"), to = valueOf(arr, "to");

  const write = (next) => onChange({ tags: next.join(", ") });
  const toggle = (tag) => {
    const without = arr.filter((t) => !(lc(t) === tag || (tag === "destination" && lc(t) === "destinations") || (tag === "tips" && ["tip", "travel-tips"].includes(lc(t))) || (tag === "route" && lc(t) === "routes")));
    let next = has(tag) ? without : [...without, tag];
    if (tag === "route" && has(tag)) next = next.filter((t) => !/^(from|to):/i.test(t)); // turning the route off clears its endpoints
    write(next);
  };
  const setEnd = (key, v) => write([...arr.filter((t) => !lc(t).startsWith(key + ":")), ...(v.trim() ? [`${key}:${v.trim()}`] : [])]);
  const setExtras = (v) => write([...arr.filter(isManaged), ...split(v)]);
  const cats = [...new Set([...SUGGESTED, ...categories])];

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="cms-category" className="text-[11px] font-semibold text-[#6B7280] block mb-1">Category <span className="font-normal text-[#9CA3AF]">(groups the post on the Blog page)</span></label>
        <input id="cms-category" list="cms-blog-cats" value={category} onChange={(e) => onChange({ category: e.target.value })} className="wp-input" placeholder="e.g. Travel Tips" />
        <datalist id="cms-blog-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {cats.slice(0, 8).map((c) => (
            <button key={c} type="button" onClick={() => onChange({ category: c })}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors"
              style={category === c ? { background: "#1B1B1B", color: "#fff", borderColor: "#1B1B1B" } : { background: "#fff", color: "#4B5563", borderColor: "#E5E7EB" }}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-[#6B7280] mb-1.5">Where this post appears on the Blog page</div>
        <div className="space-y-1.5">
          {FLAGS.map((f) => (
            <label key={f.tag} className="flex items-start gap-2 cursor-pointer" title={f.hint}>
              <input type="checkbox" checked={has(f.tag)} onChange={() => toggle(f.tag)} className="mt-0.5" />
              <span className="text-[12.5px] text-[#374151] leading-snug"><b>{f.label}</b><span className="block text-[11px] text-[#9CA3AF]">{f.hint}</span></span>
            </label>
          ))}
        </div>
        {has("route") && (
          <div className="grid grid-cols-2 gap-2 mt-2.5 pl-6">
            <input value={from} onChange={(e) => setEnd("from", e.target.value)} placeholder="From (e.g. Bangalore)" className="wp-input" />
            <input value={to} onChange={(e) => setEnd("to", e.target.value)} placeholder="To (e.g. Mysore)" className="wp-input" />
          </div>
        )}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">Other tags (comma-separated)</label>
        <input value={extras.join(", ")} onChange={(e) => setExtras(e.target.value)} className="wp-input" placeholder="airport, family, monsoon" />
      </div>
    </div>
  );
}
