/**
 * src/pages/SiteSettings.jsx
 *
 * Editor for global site chrome — the header and footer — which live on every
 * page and aren't part of any single CMS "page". Reads/writes the backend
 * GET/PUT /api/v1/blog/site-settings endpoint. The live Header/Footer read the
 * same data via useSiteSettings(), falling back to their built-in defaults, so
 * nothing changes until an editor saves here.
 *
 * Access follows the blog roles: viewers can look, editors/admins can save.
 */
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, Shield, PanelTop, PanelBottom } from "lucide-react";
import { useAuth } from "../context/BlogAuthContext";

const BRAND = "#FFC107";
const INK = "#111111";
import { API_ROOT } from "../lib/apiBase";
const API = API_ROOT;

const EMPTY = {
  header: { phones: [], nav: [] },
  footer: { phones: [], email: "", copyright: "" },
};

export default function SiteSettingsApp() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <Centered><Loader2 className="spin" size={28} style={{ color: BRAND }} /></Centered>;
  if (!isAuthenticated) return <LoginGate />;
  return <SettingsConsole />;
}

function Centered({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {children}
    </div>
  );
}

function LoginGate() {
  const { login } = useAuth();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { setErr(""); setBusy(true); const r = await login(email, pw); setBusy(false); if (!r.success) setErr(r.message || "Login failed."); };
  return (
    <Centered>
      <div style={{ width: 340, background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Shield size={18} style={{ color: BRAND }} />
          <h1 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: INK }}>Site Settings</h1>
        </div>
        <p style={{ fontSize: 12.5, color: "#6B7280", margin: "0 0 14px" }}>Sign in with your CMS account.</p>
        <input type="email" placeholder="you@abhicabs24x7.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} autoFocus />
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={inp} />
        {err && <div style={{ color: "#DC2626", fontSize: 12, margin: "6px 0" }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: 8, opacity: busy ? 0.6 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
        <a href="/admin/blog-builder" style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: 12, color: "#6B7280" }}>Back to CMS</a>
      </div>
    </Centered>
  );
}

function SettingsConsole() {
  const { token, canEdit } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/blog/site-settings`);
        const json = await res.json().catch(() => ({}));
        const d = json?.data || {};
        setData({
          header: { phones: d.header?.phones || [], nav: d.header?.nav || [] },
          footer: { phones: d.footer?.phones || [], email: d.footer?.email || "", copyright: d.footer?.copyright || "" },
        });
      } catch { setData(EMPTY); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/blog/site-settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, t: "Saved — live header & footer will update." } : { ok: false, t: json.message || "Save failed" });
    } catch (e) {
      setMsg({ ok: false, t: e.message || "Could not reach server" });
    } finally { setSaving(false); setTimeout(() => setMsg(null), 4000); }
  }, [data, token, canEdit]);

  // generic list helpers
  const setHeader = (field, v) => setData((d) => ({ ...d, header: { ...d.header, [field]: v } }));
  const setFooter = (field, v) => setData((d) => ({ ...d, footer: { ...d.footer, [field]: v } }));

  if (loading) return <Centered><Loader2 className="spin" size={28} style={{ color: BRAND }} /></Centered>;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", color: INK, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: INK, color: "#fff", padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: BRAND, display: "grid", placeItems: "center", color: INK, fontWeight: 900 }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>Site Settings</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Header &amp; footer — shown on every page</div>
        </div>
        <button onClick={save} disabled={!canEdit || saving} style={{ ...primaryBtn, opacity: canEdit ? 1 : 0.5 }}>
          {saving ? <Loader2 className="spin" size={14} /> : <Save size={14} />} Save
        </button>
        <a href="/admin/blog-builder" style={{ color: "#9CA3AF", fontSize: 12, textDecoration: "none" }}>CMS →</a>
      </header>

      {msg && <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#059669" : "#DC2626", padding: "8px 18px", fontSize: 13 }}>{msg.t}</div>}
      {!canEdit && <div style={{ background: "#FFFBEB", color: "#92400E", padding: "8px 18px", fontSize: 12.5 }}>Your role is read-only. Ask an editor to make changes.</div>}

      <main style={{ padding: 16, maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* HEADER */}
        <section style={card}>
          <H icon={<PanelTop size={15} />}>Header</H>
          <ListEditor
            title="Helpline phone numbers"
            rows={data.header.phones}
            cols={[["display", "Display (e.g. +91 80960 00182)"], ["href", "Link (e.g. tel:+918096000182)"]]}
            onChange={(v) => setHeader("phones", v)}
            blank={{ display: "", href: "tel:" }}
            disabled={!canEdit}
          />
          <ListEditor
            title="Navigation links"
            rows={data.header.nav}
            cols={[["label", "Label (e.g. Vehicles)"], ["href", "Link (e.g. /fleet)"]]}
            onChange={(v) => setHeader("nav", v)}
            blank={{ label: "", href: "/" }}
            disabled={!canEdit}
          />
        </section>

        {/* FOOTER */}
        <section style={card}>
          <H icon={<PanelBottom size={15} />}>Footer</H>
          <ListEditor
            title="Contact phone numbers"
            rows={data.footer.phones}
            cols={[["label", "Label (e.g. +91 80960 00182)"], ["href", "Link (e.g. tel:+918096000182)"]]}
            onChange={(v) => setFooter("phones", v)}
            blank={{ label: "", href: "tel:" }}
            disabled={!canEdit}
          />
          <Field label="Support email link">
            <input value={data.footer.email} onChange={(e) => setFooter("email", e.target.value)} placeholder="mailto:support@abhicabs24x7.com" style={inp} disabled={!canEdit} />
          </Field>
          <Field label="Copyright line">
            <input value={data.footer.copyright} onChange={(e) => setFooter("copyright", e.target.value)} placeholder="© 2026 Abhi Cabs. All Rights Reserved." style={inp} disabled={!canEdit} />
          </Field>
        </section>

        <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
          Leave a list empty to keep the site's built-in defaults for that part. Changes go live on the next page load after saving.
        </p>
      </main>
    </div>
  );
}

function ListEditor({ title, rows, cols, onChange, blank, disabled }) {
  const update = (i, key, val) => { const next = rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r); onChange(next); };
  const add = () => onChange([...rows, { ...blank }]);
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{title}</div>
      {rows.length === 0 && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Empty — using site default.</div>}
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          {cols.map(([key, ph]) => (
            <input key={key} value={row[key] || ""} onChange={(e) => update(i, key, e.target.value)} placeholder={ph} style={{ ...inp, marginBottom: 0 }} disabled={disabled} />
          ))}
          {!disabled && <button onClick={() => remove(i)} style={iconBtn} aria-label="Remove"><Trash2 size={14} /></button>}
        </div>
      ))}
      {!disabled && <button onClick={add} style={addBtn}><Plus size={13} /> Add</button>}
    </div>
  );
}

function H({ icon, children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 900, marginBottom: 12 }}>{icon}{children}</div>;
}
function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

const card = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 16 };
const inp = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid #D1D5DB", fontSize: 13, marginBottom: 8, boxSizing: "border-box" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: BRAND, color: INK, border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const addBtn = { display: "inline-flex", alignItems: "center", gap: 5, background: "#F3F4F6", color: INK, border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const iconBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flexShrink: 0, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, cursor: "pointer" };
