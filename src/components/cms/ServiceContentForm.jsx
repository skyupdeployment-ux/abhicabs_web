import React, { useState } from "react";
import { TRIP_MODES, FEATURE_ICONS, LISTINGS } from "../../lib/servicePage";
import { DEFAULT_LAYOUT, CUSTOM_SECTION_TYPES, newCustomSection } from "../ServiceLanding";
import { ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2, Copy, ChevronDown, ChevronUp, Pencil } from "lucide-react";

/**
 * CMS editor for service pages — FULLY DYNAMIC.
 *
 * Editors can:
 *  - Toggle any section on/off
 *  - Reorder all sections via up/down
 *  - Set background tone per section (white / tint / page / dark)
 *  - Add 9 custom section types anywhere
 *  - Duplicate any custom section
 *  - Collapse/expand sections in the form
 */
const SITE_IMAGES = ["/images/dashboard-pov.jpg", "/images/travelling.jpg", "/images/coastal-road-sedan.jpg", "/images/coastal-road-sedan.jpg", "/images/tea-garden-road.jpg", "/images/tea-garden-road.jpg", "/images/travelling.jpg", "/images/weekend.jpg", "/images/Herosection.jpg"];
const TONES = [{ value: "", label: "Default" }, { value: "white", label: "White" }, { value: "tint", label: "Tint (Yellow)" }, { value: "page", label: "Page (Gray)" }, { value: "dark", label: "Dark" }];

const box = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 18, marginBottom: 14, scrollMarginTop: 56 };
const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 800, color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #D1D5DB", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#fff" };
const btn = { padding: "7px 12px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const iconBtn = { ...btn, padding: "4px 6px", border: "none", background: "none", display: "inline-flex", alignItems: "center" };

const get = (obj, path) => path.reduce((o, k) => o?.[k], obj);
const set = (obj, path, value) => {
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  const [k, ...rest] = path;
  next[k] = rest.length ? set(obj?.[k] ?? {}, rest, value) : value;
  return next;
};
const fid = (path) => `svc-f-${path.join("-")}`;

export function jumpToServiceField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const target = el.matches("input,textarea,select,button") ? el : el.querySelector("input,textarea,select,button");
  try { (target || el).focus({ preventScroll: true }); } catch (_) {}
}

// ── Reusable form building blocks ──
function Group({ id, title, hint, disabled, collapsible = false, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} style={{ ...box, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: collapsible ? "pointer" : "default" }} onClick={collapsible ? () => setOpen(!open) : undefined}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: "#111" }}>{title}</div>
          {hint && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{hint}</div>}
        </div>
        {collapsible && (open ? <ChevronUp size={16} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={16} style={{ color: "#9CA3AF" }} />)}
      </div>
      {disabled && <div style={{ fontSize: 11.5, color: "#D97706", marginTop: 4, fontWeight: 700 }}>⚠ Hidden — enable in Layout Manager.</div>}
      {open && <div style={{ marginTop: 14, display: "grid", gap: 12, pointerEvents: disabled ? "none" : "auto" }}>{children}</div>}
    </section>
  );
}
function Field({ label, htmlFor, hint, counter, children }) {
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <label htmlFor={htmlFor} style={labelStyle}>{label}</label>{counter}
    </div>
    {children}
    {hint && <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>{hint}</div>}
  </div>);
}
function Counter({ n, lo, hi }) {
  const ok = n >= lo && n <= hi;
  return <span style={{ fontSize: 11, fontWeight: 800, color: ok ? "#059669" : "#9CA3AF" }}>{n}/{hi}</span>;
}
function TonePicker({ value, onChange, canEdit }) {
  return (
    <Field label="Background tone" htmlFor="tone-picker">
      <select style={inputStyle} disabled={!canEdit} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
    </Field>
  );
}

function ImageField({ id, value, onChange, onUpload, canEdit }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (file) => {
    if (!file || !onUpload) return;
    setBusy(true); setErr("");
    try { onChange(await onUpload(file)); } catch (e) { setErr(e?.message || "Upload failed."); }
    finally { setBusy(false); }
  };
  return (<div>
    <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
      <div style={{ width: 88, height: 56, flex: "none", borderRadius: 10, border: "1px solid #E5E7EB", background: value ? `#F3F4F6 url(${value}) center/cover` : "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, color: "#9CA3AF" }}>{!value && "No image"}</div>
      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 6 }}>
        <input id={id} list="svc-images" style={inputStyle} disabled={!canEdit} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or https://…" />
        {onUpload && canEdit && (
          <label style={{ ...btn, justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" disabled={busy} style={{ display: "none" }} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        )}
      </div>
    </div>
    {err && <div role="alert" style={{ fontSize: 12, color: "#B91C1C", marginTop: 6 }}>{err}</div>}
  </div>);
}

function ListEditor({ items = [], blank, render, max = 12, addLabel, onChange, canEdit }) {
  return (<div style={{ display: "grid", gap: 10 }}>
    {items.map((it, i) => (
      <div key={i} style={{ border: "1px solid #F3F4F6", borderRadius: 12, padding: 12, background: "#FAFAFA", display: "grid", gap: 8 }}>
        {render(it, (field, value) => onChange(items.map((x, j) => (j === i ? { ...x, [field]: value } : x))), i)}
        {canEdit && <div><button type="button" style={{ ...btn, color: "#DC2626" }} onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button></div>}
      </div>
    ))}
    {canEdit && items.length < max && <button type="button" style={{ ...btn, justifySelf: "start" }} onClick={() => onChange([...items, typeof blank === "function" ? blank() : blank])}>+ {addLabel}</button>}
  </div>);
}

// ── Section meta for layout manager ──
const SECTION_META = {
  hero: { label: "Hero", emoji: "●" },
  intro: { label: "Introduction", emoji: "◆" },
  features: { label: "Highlights", emoji: "★" },
  pricing: { label: "Pricing", emoji: "◈" },
  routes: { label: "Popular Routes", emoji: "◉" },
  coverage: { label: "Service Areas", emoji: "◎" },
  tips: { label: "Before You Book", emoji: "✓" },
  how: { label: "How It Works", emoji: "▣" },
  faqs: { label: "FAQs", emoji: "?" },
  relatedGuides: { label: "Related Guides", emoji: "◇" },
  exploreServices: { label: "Explore Services", emoji: "◈" },
  serviceDirectory: { label: "Service Directory", emoji: "▤" },
  cta: { label: "Call to Action", emoji: "▶" },
};

const TYPE_EMOJI = { text: "T", stats: "#", testimonial: "Q", gallery: "G", video: "V", banner: "!", comparison: "=", iconList: "*", checklist: "✓", richContent: "R", table: "⊞", buttons: "→", imageText: "I" };

// ── Layout Manager ──
function LayoutManager({ layout, customSections = [], mode, canEdit, onChange, onAddCustom, onRemoveCustom, onDuplicateCustom }) {
  const move = (idx, dir) => {
    const next = [...layout];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  };
  const toggle = (idx) => {
    const next = [...layout];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    onChange(next);
  };
  const setTone = (idx, tone) => {
    const next = [...layout];
    next[idx] = { ...next[idx], tone };
    onChange(next);
  };
  const [showAdd, setShowAdd] = useState(false);
  const [showTone, setShowTone] = useState(null);

  return (
    <section id="svc-sec-layout" style={{ ...box, background: "#FAFAFA", borderColor: "#E5E7EB" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: "#111" }}>📐 Layout Manager</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Toggle, reorder, style and add sections. Custom blocks can go anywhere.</div>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setShowAdd(!showAdd)} style={{ ...btn, background: "#111", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Plus size={13} /> Add section
          </button>
        )}
      </div>

      {showAdd && canEdit && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 8 }}>
          {CUSTOM_SECTION_TYPES.map((ct) => (
            <button key={ct.type} type="button" onClick={() => { onAddCustom(ct.type); setShowAdd(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.background = "#FFFBEB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#fff"; }}>
              <span style={{ fontSize: 20 }}>{ct.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{ct.label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{ct.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gap: 4 }}>
        {layout.map((item, idx) => {
          const isCustom = item.id.startsWith("custom-");
          const cs = isCustom ? customSections.find((s) => s.id === item.id) : null;
          const meta = isCustom
            ? { label: cs?.heading || "Custom Section", emoji: TYPE_EMOJI[cs?.type] || "📦" }
            : (SECTION_META[item.id] || { label: item.id, emoji: "📄" });
          const hidden = !item.enabled;
          if (item.id === "routes" && !mode) return null;

          return (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 10,
              background: hidden ? "#F9FAFB" : "#fff", border: `1px solid ${hidden ? "#F3F4F6" : "#E5E7EB"}`,
              opacity: hidden ? 0.5 : 1, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{meta.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {meta.label}
                {isCustom && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginLeft: 6 }}>CUSTOM</span>}
                {item.tone && <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, marginLeft: 6, background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>{item.tone}</span>}
              </span>

              {/* Tone picker */}
              {canEdit && (
                <div style={{ position: "relative" }}>
                  <button type="button" onClick={() => setShowTone(showTone === idx ? null : idx)} title="Change background" style={{ ...iconBtn, fontSize: 12 }}>🎨</button>
                  {showTone === idx && (
                    <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 10, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 4, minWidth: 120, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                      {TONES.map((t) => (
                        <button key={t.value} type="button" onClick={() => { setTone(idx, t.value); setShowTone(null); }}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 7, border: "none", background: item.tone === t.value ? "#F3F4F6" : "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Edit — scroll to section editor */}
              <button type="button" onClick={() => {
                const secId = isCustom ? `svc-sec-${item.id}` : `svc-sec-${item.id}`;
                const el = document.getElementById(secId);
                if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
              }} title="Edit section" style={{ ...iconBtn, color: "#3B82F6" }}><Pencil size={13} /></button>

              {canEdit && <button type="button" onClick={() => toggle(idx)} title={hidden ? "Show" : "Hide"} style={{ ...iconBtn, color: hidden ? "#DC2626" : "#16A34A" }}>{hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              {canEdit && idx > 0 && <button type="button" onClick={() => move(idx, -1)} title="Move up" style={iconBtn}><ArrowUp size={14} /></button>}
              {canEdit && idx < layout.length - 1 && <button type="button" onClick={() => move(idx, 1)} title="Move down" style={iconBtn}><ArrowDown size={14} /></button>}
              {canEdit && isCustom && <button type="button" onClick={() => onDuplicateCustom(item.id)} title="Duplicate" style={iconBtn}><Copy size={13} /></button>}
              {canEdit && isCustom && <button type="button" onClick={() => onRemoveCustom(item.id)} title="Delete" style={{ ...iconBtn, color: "#DC2626" }}><Trash2 size={14} /></button>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Custom section editors ──
function CustomSectionEditor({ section, onChange, canEdit, onUpload }) {
  const up = (field, value) => onChange({ ...section, [field]: value });
  const id = section.id;
  const typeInfo = CUSTOM_SECTION_TYPES.find((t) => t.type === section.type);

  return (
    <Group id={`svc-sec-${id}`} title={`${typeInfo?.emoji || "✦"} ${section.heading || typeInfo?.label || "Custom Section"}`} hint={typeInfo?.desc || ""} collapsible>
      <Field label="Section heading" htmlFor={`${id}-heading`}>
        <input id={`${id}-heading`} style={inputStyle} disabled={!canEdit} value={section.heading || ""} onChange={(e) => up("heading", e.target.value)} />
      </Field>
      <Field label="Subtitle (optional)" htmlFor={`${id}-subtitle`}>
        <input id={`${id}-subtitle`} style={inputStyle} disabled={!canEdit} value={section.subtitle || ""} onChange={(e) => up("subtitle", e.target.value)} placeholder="A short line under the heading" />
      </Field>
      <TonePicker value={section.tone} onChange={(v) => up("tone", v)} canEdit={canEdit} />

      {/* ── TYPE-SPECIFIC FIELDS ── */}

      {section.type === "text" && (<>
        <Field label="Paragraphs (one per line)" htmlFor={`${id}-body`}>
          <textarea id={`${id}-body`} style={{ ...inputStyle, resize: "vertical" }} rows={5} disabled={!canEdit} value={(section.body || []).join("\n")} onChange={(e) => up("body", e.target.value.split("\n"))} />
        </Field>
        <Field label="Image (optional)" htmlFor={`${id}-image`}>
          <ImageField id={`${id}-image`} value={section.image} canEdit={canEdit} onUpload={onUpload} onChange={(v) => up("image", v)} />
        </Field>
      </>)}

      {section.type === "stats" && (
        <ListEditor items={section.items || []} max={8} addLabel="Add stat" blank={{ value: "", label: "" }} canEdit={canEdit} onChange={(v) => up("items", v)}
          render={(it, s) => (<>
            <input style={inputStyle} placeholder="Value (e.g. 500+)" disabled={!canEdit} value={it.value} onChange={(e) => s("value", e.target.value)} />
            <input style={inputStyle} placeholder="Label" disabled={!canEdit} value={it.label} onChange={(e) => s("label", e.target.value)} />
          </>)} />
      )}

      {section.type === "testimonial" && (
        <ListEditor items={section.items || []} max={6} addLabel="Add testimonial" blank={{ quote: "", name: "", role: "" }} canEdit={canEdit} onChange={(v) => up("items", v)}
          render={(it, s) => (<>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} placeholder="Quote" disabled={!canEdit} value={it.quote} onChange={(e) => s("quote", e.target.value)} />
            <input style={inputStyle} placeholder="Name" disabled={!canEdit} value={it.name} onChange={(e) => s("name", e.target.value)} />
            <input style={inputStyle} placeholder="Role (optional)" disabled={!canEdit} value={it.role} onChange={(e) => s("role", e.target.value)} />
          </>)} />
      )}

      {section.type === "gallery" && (<>
        <Field label="Columns (2–6)" htmlFor={`${id}-cols`}>
          <select id={`${id}-cols`} style={inputStyle} disabled={!canEdit} value={section.columns || 4} onChange={(e) => up("columns", +e.target.value)}>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} columns</option>)}
          </select>
        </Field>
        <ListEditor items={section.images || []} max={12} addLabel="Add image" blank={{ url: "", alt: "" }} canEdit={canEdit} onChange={(v) => up("images", v)}
          render={(it, s) => (<>
            <ImageField id={`${id}-img-${Math.random()}`} value={it.url} canEdit={canEdit} onUpload={onUpload} onChange={(v) => s("url", v)} />
            <input style={inputStyle} placeholder="Alt text" disabled={!canEdit} value={it.alt} onChange={(e) => s("alt", e.target.value)} />
          </>)} />
        <Field label="Caption (optional)" htmlFor={`${id}-caption`}>
          <input id={`${id}-caption`} style={inputStyle} disabled={!canEdit} value={section.caption || ""} onChange={(e) => up("caption", e.target.value)} />
        </Field>
      </>)}

      {section.type === "video" && (<>
        <Field label="YouTube or Vimeo URL" htmlFor={`${id}-url`} hint="Paste the full video URL.">
          <input id={`${id}-url`} style={inputStyle} disabled={!canEdit} value={section.url || ""} onChange={(e) => up("url", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        </Field>
        <Field label="Caption (optional)" htmlFor={`${id}-vcaption`}>
          <input id={`${id}-vcaption`} style={inputStyle} disabled={!canEdit} value={section.caption || ""} onChange={(e) => up("caption", e.target.value)} />
        </Field>
      </>)}

      {section.type === "banner" && (<>
        <Field label="Button text" htmlFor={`${id}-btntxt`}>
          <input id={`${id}-btntxt`} style={inputStyle} disabled={!canEdit} value={section.buttonText || ""} onChange={(e) => up("buttonText", e.target.value)} placeholder="Book Now" />
        </Field>
        <Field label="Button URL" htmlFor={`${id}-btnurl`} hint="Leave empty to use the page's booking form.">
          <input id={`${id}-btnurl`} style={inputStyle} disabled={!canEdit} value={section.buttonUrl || ""} onChange={(e) => up("buttonUrl", e.target.value)} placeholder="/services or https://..." />
        </Field>
      </>)}

      {section.type === "comparison" && (<>
        <Field label="Feature column label" htmlFor={`${id}-feat`}>
          <input id={`${id}-feat`} style={inputStyle} disabled={!canEdit} value={section.featureLabel || "Feature"} onChange={(e) => up("featureLabel", e.target.value)} />
        </Field>
        <Field label="Comparison columns (one per line)" htmlFor={`${id}-compcols`}>
          <textarea id={`${id}-compcols`} style={{ ...inputStyle, resize: "vertical" }} rows={3} disabled={!canEdit}
            value={(section.columns || []).join("\n")} onChange={(e) => up("columns", e.target.value.split("\n").filter(Boolean))} placeholder={"Basic\nPremium\nEnterprise"} />
        </Field>
        <ListEditor items={section.rows || []} max={15} addLabel="Add row" blank={() => ({ feature: "", values: (section.columns || []).map(() => "") })} canEdit={canEdit}
          onChange={(v) => up("rows", v)}
          render={(row, s, ri) => (<>
            <input style={inputStyle} placeholder="Feature name" disabled={!canEdit} value={row.feature} onChange={(e) => s("feature", e.target.value)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(section.columns || []).map((col, ci) => (
                <input key={ci} style={{ ...inputStyle, flex: 1, minWidth: 80 }} placeholder={`${col} (yes/no/text)`} disabled={!canEdit}
                  value={(row.values || [])[ci] || ""}
                  onChange={(e) => { const vals = [...(row.values || [])]; vals[ci] = e.target.value; s("values", vals); }} />
              ))}
            </div>
          </>)} />
        <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>Type <b>yes</b> for a green checkmark, <b>no</b> for a dash, or any text.</div>
      </>)}

      {section.type === "iconList" && (
        <ListEditor items={section.items || []} max={12} addLabel="Add item" blank={{ emoji: "✅", title: "", desc: "" }} canEdit={canEdit} onChange={(v) => up("items", v)}
          render={(it, s) => (<>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, width: 60, flex: "none", textAlign: "center" }} placeholder="✅" disabled={!canEdit} value={it.emoji} onChange={(e) => s("emoji", e.target.value)} />
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Title" disabled={!canEdit} value={it.title} onChange={(e) => s("title", e.target.value)} />
            </div>
            <input style={inputStyle} placeholder="Short description" disabled={!canEdit} value={it.desc} onChange={(e) => s("desc", e.target.value)} />
          </>)} />
      )}

      {section.type === "checklist" && (
        <Field label="Items (one per line)" htmlFor={`${id}-items`}>
          <textarea id={`${id}-items`} style={{ ...inputStyle, resize: "vertical" }} rows={5} disabled={!canEdit}
            value={(section.items || []).join("\n")} onChange={(e) => up("items", e.target.value.split("\n").filter(Boolean))} />
        </Field>
      )}

      {section.type === "richContent" && (
        <Field label="HTML content" htmlFor={`${id}-html`} hint="Full HTML supported — headings, paragraphs, bold, italic, links, images (<img>), tables, lists. Use the toolbar or write HTML directly.">
          <div style={{ marginBottom: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { label: "Bold", html: "<strong>text</strong>" },
              { label: "Italic", html: "<em>text</em>" },
              { label: "Link", html: '<a href="/services/local">link text</a>' },
              { label: "Image", html: '<img src="/images/dashboard-pov.jpg" alt="description" />' },
              { label: "H2", html: "<h2>Heading</h2>" },
              { label: "H3", html: "<h3>Sub-heading</h3>" },
              { label: "List", html: "<ul><li>Item 1</li><li>Item 2</li></ul>" },
              { label: "Table", html: "<table><tr><th>Col 1</th><th>Col 2</th></tr><tr><td>Data</td><td>Data</td></tr></table>" },
              { label: "Quote", html: "<blockquote>Quote text</blockquote>" },
            ].map((t) => (
              <button key={t.label} type="button" disabled={!canEdit} onClick={() => {
                const ta = document.getElementById(`${id}-html`);
                if (!ta) return;
                const start = ta.selectionStart, end = ta.selectionEnd;
                const val = section.html || "";
                up("html", val.slice(0, start) + t.html + val.slice(end));
              }} style={{ ...btn, fontSize: 11, padding: "4px 8px" }}>{t.label}</button>
            ))}
          </div>
          <textarea id={`${id}-html`} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} rows={12} disabled={!canEdit}
            value={section.html || ""} onChange={(e) => up("html", e.target.value)} />
          {section.html && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Preview</summary>
              <div style={{ marginTop: 8, padding: 16, border: "1px solid #E5E7EB", borderRadius: 12, background: "#fff", fontSize: 14, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: section.html }} />
            </details>
          )}
        </Field>
      )}

      {section.type === "table" && (<>
        <Field label="Column headers (one per line)" htmlFor={`${id}-headers`}>
          <textarea id={`${id}-headers`} style={{ ...inputStyle, resize: "vertical" }} rows={3} disabled={!canEdit}
            value={(section.headers || []).join("\n")} onChange={(e) => up("headers", e.target.value.split("\n").filter(Boolean))} placeholder={"Column 1\nColumn 2\nColumn 3"} />
        </Field>
        <ListEditor items={section.rows || []} max={30} addLabel="Add row"
          blank={() => ({ cells: (section.headers || []).map(() => "") })} canEdit={canEdit}
          onChange={(v) => up("rows", v)}
          render={(row, s) => (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(section.headers || []).map((h, ci) => (
                <input key={ci} style={{ ...inputStyle, flex: 1, minWidth: 80 }} placeholder={h} disabled={!canEdit}
                  value={(row.cells || [])[ci] || ""}
                  onChange={(e) => { const cells = [...(row.cells || [])]; cells[ci] = e.target.value; s("cells", cells); }} />
              ))}
            </div>
          )} />
        <Field label="Caption (optional)" htmlFor={`${id}-tcaption`}>
          <input id={`${id}-tcaption`} style={inputStyle} disabled={!canEdit} value={section.caption || ""} onChange={(e) => up("caption", e.target.value)} />
        </Field>
      </>)}

      {section.type === "buttons" && (<>
        <Field label="Alignment" htmlFor={`${id}-align`}>
          <select id={`${id}-align`} style={inputStyle} disabled={!canEdit} value={section.align || "center"} onChange={(e) => up("align", e.target.value)}>
            <option value="center">Center</option><option value="flex-start">Left</option><option value="flex-end">Right</option>
          </select>
        </Field>
        <ListEditor items={section.buttons || []} max={6} addLabel="Add button"
          blank={{ label: "New Link", url: "", style: "primary", external: false }} canEdit={canEdit}
          onChange={(v) => up("buttons", v)}
          render={(bt, s) => (<>
            <input style={inputStyle} placeholder="Button label" disabled={!canEdit} value={bt.label} onChange={(e) => s("label", e.target.value)} />
            <input style={inputStyle} placeholder="URL (e.g. /fleet or https://...)" disabled={!canEdit} value={bt.url} onChange={(e) => s("url", e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...inputStyle, flex: 1 }} disabled={!canEdit} value={bt.style} onChange={(e) => s("style", e.target.value)}>
                <option value="primary">Yellow (primary)</option>
                <option value="outline">Outline</option>
                <option value="ghost">Text link</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                <input type="checkbox" disabled={!canEdit} checked={!!bt.external} onChange={(e) => s("external", e.target.checked)} />
                Opens new tab
              </label>
            </div>
          </>)} />
      </>)}

      {section.type === "imageText" && (<>
        <Field label="Image" htmlFor={`${id}-it-img`}>
          <ImageField id={`${id}-it-img`} value={section.image} canEdit={canEdit} onUpload={onUpload} onChange={(v) => up("image", v)} />
        </Field>
        <Field label="Image position" htmlFor={`${id}-imgpos`}>
          <select id={`${id}-imgpos`} style={inputStyle} disabled={!canEdit} value={section.imagePosition || "left"} onChange={(e) => up("imagePosition", e.target.value)}>
            <option value="left">Image left, text right</option>
            <option value="right">Image right, text left</option>
          </select>
        </Field>
        <Field label="Image caption (optional)" htmlFor={`${id}-imgcap`}>
          <input id={`${id}-imgcap`} style={inputStyle} disabled={!canEdit} value={section.imageCaption || ""} onChange={(e) => up("imageCaption", e.target.value)} />
        </Field>
        <Field label="Paragraphs (one per line)" htmlFor={`${id}-itbody`}>
          <textarea id={`${id}-itbody`} style={{ ...inputStyle, resize: "vertical" }} rows={5} disabled={!canEdit}
            value={(section.body || []).join("\n")} onChange={(e) => up("body", e.target.value.split("\n"))} />
        </Field>
        <Field label="Link text (optional)" htmlFor={`${id}-ltxt`}>
          <input id={`${id}-ltxt`} style={inputStyle} disabled={!canEdit} value={section.linkText || ""} onChange={(e) => up("linkText", e.target.value)} placeholder="Learn More" />
        </Field>
        <Field label="Link URL" htmlFor={`${id}-lurl`}>
          <input id={`${id}-lurl`} style={inputStyle} disabled={!canEdit} value={section.linkUrl || ""} onChange={(e) => up("linkUrl", e.target.value)} placeholder="/services/local or https://..." />
        </Field>
      </>)}
    </Group>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN FORM
// ══════════════════════════════════════════════════════════════════════
export default function ServiceContentForm({ content: c, onChange, canEdit = true, groups = [], onUpload }) {
  const up = (path, value) => onChange(set(c, path, value));
  const val = (path) => get(c, path) ?? "";
  const T = (path, props = {}) => <input id={fid(path)} style={inputStyle} disabled={!canEdit} value={val(path)} onChange={(e) => up(path, e.target.value)} {...props} />;
  const A = (path, rows = 3, asLines = false) => (
    <textarea id={fid(path)} style={{ ...inputStyle, resize: "vertical" }} rows={rows} disabled={!canEdit}
      value={asLines ? (get(c, path) || []).join("\n") : val(path)}
      onChange={(e) => up(path, asLines ? e.target.value.split("\n") : e.target.value)} />
  );
  const Img = (path) => <ImageField id={fid(path)} value={val(path)} canEdit={canEdit} onUpload={onUpload} onChange={(v) => up(path, v)} />;

  const layout = c.layout || DEFAULT_LAYOUT;
  const customSections = c.customSections || [];
  const isEnabled = (id) => { const item = layout.find((l) => l.id === id); return item ? item.enabled : true; };

  const handleLayoutChange = (newLayout) => up(["layout"], newLayout);
  const handleAddCustom = (type) => {
    const section = newCustomSection(type);
    onChange({ ...c, customSections: [...customSections, section], layout: [...layout, { id: section.id, enabled: true }] });
  };
  const handleRemoveCustom = (id) => {
    onChange({ ...c, customSections: customSections.filter((s) => s.id !== id), layout: layout.filter((l) => l.id !== id) });
  };
  const handleDuplicateCustom = (id) => {
    const original = customSections.find((s) => s.id === id);
    if (!original) return;
    const clone = { ...JSON.parse(JSON.stringify(original)), id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, heading: `${original.heading} (copy)` };
    const layoutIdx = layout.findIndex((l) => l.id === id);
    const newLayout = [...layout];
    newLayout.splice(layoutIdx + 1, 0, { id: clone.id, enabled: true });
    onChange({ ...c, customSections: [...customSections, clone], layout: newLayout });
  };
  const handleCustomChange = (id, updated) => onChange({ ...c, customSections: customSections.map((s) => (s.id === id ? updated : s)) });

  // Build jump nav
  const navItems = [["Layout", "svc-sec-layout"], ["Listing", "svc-sec-listing"]];
  for (const item of layout) {
    if (item.id === "routes" && !c.mode) continue;
    if (item.id.startsWith("custom-")) {
      const cs = customSections.find((s) => s.id === item.id);
      navItems.push([cs?.heading?.slice(0, 16) || "Custom", `svc-sec-${item.id}`]);
    } else if (["hero", "intro", "features", "pricing", "routes", "how", "faqs", "cta"].includes(item.id)) {
      navItems.push([SECTION_META[item.id]?.label || item.id, `svc-sec-${item.id}`]);
    }
  }
  navItems.push(["SEO", "svc-sec-seo"]);

  return (
    <div>
      <datalist id="svc-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
      <datalist id="svc-images">{SITE_IMAGES.map((s) => <option key={s} value={s} />)}</datalist>

      {/* Jump bar */}
      <nav aria-label="Jump to section" style={{ position: "sticky", top: 0, zIndex: 5, background: "#F3F4F6", padding: "8px 0", marginBottom: 6, display: "flex", gap: 6, overflowX: "auto" }}>
        {navItems.map(([label, id]) => (
          <button key={id} type="button" onClick={() => jumpToServiceField(id)} style={{ flex: "none", fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 999, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </nav>

      {/* Layout Manager */}
      <LayoutManager layout={layout} customSections={customSections} mode={c.mode} canEdit={canEdit}
        onChange={handleLayoutChange} onAddCustom={handleAddCustom} onRemoveCustom={handleRemoveCustom} onDuplicateCustom={handleDuplicateCustom} />

      {/* Listing settings */}
      <Group id="svc-sec-listing" title="Where this page is listed" hint="Featured pages appear in the header menu, footer, Services cards and related links.">
        <Field label="Listing" htmlFor="svc-f-listing"><select id="svc-f-listing" style={inputStyle} disabled={!canEdit} value={c.listing || "directory"} onChange={(e) => up(["listing"], e.target.value)}>{LISTINGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></Field>
        <Field label="Directory group" htmlFor={fid(["group"])}>{T(["group"], { list: "svc-groups", placeholder: "e.g. Car Rental Services" })}</Field>
        {(c.listing || "directory") === "featured" && <Field label="Icon" htmlFor="svc-f-icon"><select id="svc-f-icon" style={inputStyle} disabled={!canEdit} value={c.icon || "car"} onChange={(e) => up(["icon"], e.target.value)}>{FEATURE_ICONS.map((n) => <option key={n}>{n}</option>)}</select></Field>}
        <Field label="Booking form" htmlFor="svc-f-mode" hint="Sets which trip type the form opens on."><select id="svc-f-mode" style={inputStyle} disabled={!canEdit} value={c.mode || ""} onChange={(e) => up(["mode"], e.target.value)}>{TRIP_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
        {!c.mode && <Field label="Enquiry subject" htmlFor="svc-f-enquiry"><select id="svc-f-enquiry" style={inputStyle} disabled={!canEdit} value={c.enquirySubject || "corporate"} onChange={(e) => up(["enquirySubject"], e.target.value)}><option value="corporate">Corporate Enquiry</option><option value="booking">Booking Assistance</option><option value="fare">Fare and Pricing</option><option value="general">General Enquiry</option></select></Field>}
      </Group>

      {/* Section editors — rendered in LAYOUT ORDER */}
      {layout.map((item) => {
        if (item.id.startsWith("custom-")) {
          const cs = customSections.find((s) => s.id === item.id);
          if (!cs) return null;
          return <CustomSectionEditor key={item.id} section={cs} onChange={(u) => handleCustomChange(item.id, u)} canEdit={canEdit} onUpload={onUpload} />;
        }
        const enabled = item.enabled;

        // Reusable extra content editor for any built-in section
        const ExtraHtml = ({ section }) => (
          <details style={{ marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
            <summary style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", cursor: "pointer", marginBottom: 8 }}>+ Add extra content (images, links, tables, HTML)</summary>
            <div style={{ marginBottom: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                { label: "Bold", html: "<strong>text</strong>" },
                { label: "Link", html: '<a href="/services/local">link text</a>' },
                { label: "Image", html: '<img src="/images/dashboard-pov.jpg" alt="" />' },
                { label: "Table", html: "<table><tr><th>Col 1</th><th>Col 2</th></tr><tr><td>Data</td><td>Data</td></tr></table>" },
                { label: "List", html: "<ul><li>Item 1</li><li>Item 2</li></ul>" },
                { label: "H3", html: "<h3>Sub-heading</h3>" },
                { label: "Button", html: '<a href="#booking" style="display:inline-block;padding:10px 24px;background:#E6AC00;color:#111;border-radius:999px;font-weight:bold;text-decoration:none">Book Now</a>' },
              ].map((t) => (
                <button key={t.label} type="button" disabled={!canEdit} onClick={() => {
                  const ta = document.getElementById(`extra-${section}`);
                  if (!ta) return;
                  const start = ta.selectionStart, end = ta.selectionEnd;
                  const v = val([section, "extraHtml"]) || "";
                  up([section, "extraHtml"], v.slice(0, start) + t.html + v.slice(end));
                }} style={{ ...btn, fontSize: 11, padding: "3px 7px" }}>{t.label}</button>
              ))}
            </div>
            <textarea id={`extra-${section}`} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} rows={6} disabled={!canEdit}
              value={val([section, "extraHtml"]) || ""} onChange={(e) => up([section, "extraHtml"], e.target.value)}
              placeholder="Add any HTML here — images, links, tables, buttons. This renders below the section's main content." />
            {val([section, "extraHtml"]) && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 11, color: "#6B7280", cursor: "pointer" }}>Preview</summary>
                <div style={{ marginTop: 6, padding: 12, border: "1px solid #E5E7EB", borderRadius: 10, background: "#fff", fontSize: 13, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: val([section, "extraHtml"]) }} />
              </details>
            )}
          </details>
        );

        switch (item.id) {
          case "hero": return (
            <Group key="hero" id="svc-sec-hero" title="Hero" disabled={!enabled} collapsible>
              <Field label="Heading" htmlFor={fid(["hero","heading"])}>{T(["hero","heading"])}</Field>
              <Field label="Description" htmlFor={fid(["hero","description"])}>{A(["hero","description"],3)}</Field>
              <Field label="Background image" htmlFor={fid(["hero","image"])}>{Img(["hero","image"])}</Field>
              <ExtraHtml section="hero" />
            </Group>
          );
          case "intro": return (
            <Group key="intro" id="svc-sec-intro" title="Introduction" disabled={!enabled} collapsible>
              <Field label="Eyebrow" htmlFor={fid(["intro","eyebrow"])}>{T(["intro","eyebrow"])}</Field>
              <Field label="Heading" htmlFor={fid(["intro","heading"])}>{T(["intro","heading"])}</Field>
              <Field label="Paragraphs (one per line)" htmlFor={fid(["intro","body"])}>{A(["intro","body"],5,true)}</Field>
              <Field label="Bullet points (one per line)" htmlFor={fid(["intro","bullets"])}>{A(["intro","bullets"],4,true)}</Field>
              <Field label="Image" htmlFor={fid(["intro","image"])}>{Img(["intro","image"])}</Field>
              <Field label="Link text (optional)" htmlFor={fid(["intro","linkText"])}>{T(["intro","linkText"], { placeholder: "Learn More" })}</Field>
              <Field label="Link URL" htmlFor={fid(["intro","linkUrl"])}>{T(["intro","linkUrl"], { placeholder: "/fleet or https://..." })}</Field>
              <ExtraHtml section="intro" />
            </Group>
          );
          case "features": return (
            <Group key="features" id="svc-sec-features" title="Highlights" hint="Up to 8 benefit cards." disabled={!enabled} collapsible>
              <Field label="Section heading" htmlFor={fid(["features","heading"])}>{T(["features","heading"])}</Field>
              <Field label="Section description (optional)" htmlFor={fid(["features","description"])}>{A(["features","description"],2)}</Field>
              <ListEditor items={c.features?.items} max={8} addLabel="Add highlight" blank={{icon:"shield",title:"",desc:""}} canEdit={canEdit} onChange={(v)=>up(["features","items"],v)}
                render={(it,s)=>(<>
                  <select style={inputStyle} disabled={!canEdit} value={it.icon} onChange={(e)=>s("icon",e.target.value)}>{FEATURE_ICONS.map((n)=><option key={n}>{n}</option>)}</select>
                  <input style={inputStyle} placeholder="Title" disabled={!canEdit} value={it.title} onChange={(e)=>s("title",e.target.value)} />
                  <input style={inputStyle} placeholder="Description" disabled={!canEdit} value={it.desc} onChange={(e)=>s("desc",e.target.value)} />
                </>)} />
              <ExtraHtml section="features" />
            </Group>
          );
          case "pricing": return (
            <Group key="pricing" id="svc-sec-pricing" title="Pricing" disabled={!enabled} collapsible>
              <Field label="Heading" htmlFor={fid(["pricing","heading"])}>{T(["pricing","heading"])}</Field>
              <Field label="Description" htmlFor={fid(["pricing","description"])}>{T(["pricing","description"])}</Field>
              <Field label="Fare factors (one per line)" htmlFor={fid(["pricing","points"])}>{A(["pricing","points"],5,true)}</Field>
              <Field label="Additional note (optional)" htmlFor={fid(["pricing","note"])}>{A(["pricing","note"],2)}</Field>
              <ExtraHtml section="pricing" />
            </Group>
          );
          case "how": return (
            <Group key="how" id="svc-sec-how" title="How It Works" hint="Up to 6 steps." disabled={!enabled} collapsible>
              <Field label="Heading" htmlFor={fid(["how","heading"])}>{T(["how","heading"])}</Field>
              <ListEditor items={c.how?.steps} max={6} addLabel="Add step" blank={{title:"",desc:""}} canEdit={canEdit} onChange={(v)=>up(["how","steps"],v)}
                render={(it,s)=>(<>
                  <input style={inputStyle} placeholder="Step title" disabled={!canEdit} value={it.title} onChange={(e)=>s("title",e.target.value)} />
                  <input style={inputStyle} placeholder="Description" disabled={!canEdit} value={it.desc} onChange={(e)=>s("desc",e.target.value)} />
                </>)} />
              <ExtraHtml section="how" />
            </Group>
          );
          case "routes": return c.mode ? (
            <Group key="routes" id="svc-sec-routes" title="Popular Routes" disabled={!enabled} collapsible>
              <Field label="Routes heading (optional)" htmlFor={fid(["routesHeading"])}>{T(["routesHeading"], { placeholder: "Frequently booked routes" })}</Field>
              <ListEditor items={c.routes} max={8} addLabel="Add route" blank={{from:"",to:""}} canEdit={canEdit} onChange={(v)=>up(["routes"],v)}
                render={(it,s)=>(<>
                  <input style={inputStyle} placeholder="From (e.g. Bangalore)" disabled={!canEdit} value={it.from} onChange={(e)=>s("from",e.target.value)} />
                  <input style={inputStyle} placeholder="To (e.g. Mysore)" disabled={!canEdit} value={it.to} onChange={(e)=>s("to",e.target.value)} />
                </>)} />
              <ExtraHtml section="routes" />
            </Group>
          ) : null;
          case "faqs": return (
            <Group key="faqs" id="svc-sec-faqs" title="FAQs" disabled={!enabled} collapsible>
              <Field label="FAQs heading (optional)" htmlFor={fid(["faqHeading"])}>{T(["faqHeading"], { placeholder: "Frequently asked questions" })}</Field>
              <ListEditor items={c.faqs} max={12} addLabel="Add question" blank={{q:"",a:""}} canEdit={canEdit} onChange={(v)=>up(["faqs"],v)}
                render={(it,s)=>(<>
                  <input style={inputStyle} placeholder="Question" disabled={!canEdit} value={it.q} onChange={(e)=>s("q",e.target.value)} />
                  <textarea style={{...inputStyle,resize:"vertical"}} rows={2} placeholder="Answer (supports <a>, <b>, <img> HTML tags)" disabled={!canEdit} value={it.a} onChange={(e)=>s("a",e.target.value)} />
                </>)} />
              <ExtraHtml section="faqs" />
            </Group>
          );
          case "cta": return (
            <Group key="cta" id="svc-sec-cta" title="Call to Action" disabled={!enabled} collapsible>
              <Field label="Line 1" htmlFor={fid(["cta","line1"])}>{T(["cta","line1"])}</Field>
              <Field label="Highlighted line (yellow)" htmlFor={fid(["cta","line2"])}>{T(["cta","line2"])}</Field>
              <Field label="Description" htmlFor={fid(["cta","description"])}>{A(["cta","description"],2)}</Field>
              <Field label="Button text (optional)" htmlFor={fid(["cta","buttonText"])}>{T(["cta","buttonText"], { placeholder: "Book Your Ride" })}</Field>
              <Field label="Button URL (optional)" htmlFor={fid(["cta","buttonUrl"])}>{T(["cta","buttonUrl"], { placeholder: "#booking or /contact-us" })}</Field>
              <ExtraHtml section="cta" />
            </Group>
          );
          default: return null;
        }
      })}

      <Group id="svc-sec-seo" title="SEO" hint="How the page looks in Google.">
        <Field label="SEO title" htmlFor={fid(["seo","title"])} counter={<Counter n={val(["seo","title"]).length} lo={30} hi={60} />}>{T(["seo","title"])}</Field>
        <Field label="Meta description" htmlFor={fid(["seo","description"])} counter={<Counter n={val(["seo","description"]).length} lo={120} hi={160} />}>{A(["seo","description"],2)}</Field>
      </Group>
    </div>
  );
}
