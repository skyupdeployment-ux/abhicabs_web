/**
 * src/pages/SeoAudit.jsx
 *
 * Full-site SEO audit console (client-side). Discovers URLs from the sitemap,
 * robots.txt and by crawling internal links on the SAME ORIGIN, tests each
 * eligible URL, runs the deterministic rule engine, and presents a dashboard,
 * URL inventory, a prioritized Improvement Center, exports and run history.
 *
 * Honest about browser limits: external links are UNVERIFIED (CORS), there is
 * no PageSpeed/Search Console data (backend), and history/status persist in
 * this browser's localStorage, not on a server.
 *
 * Access follows the existing blog roles (BlogAuthContext): viewers can see
 * results; editors/admins can run audits and change issue status.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play, Square, RefreshCw, FileJson, FileText, Settings as SettingsIcon,
  LayoutDashboard, ListChecks, Link2, History as HistoryIcon,
  AlertTriangle, CheckCircle, Shield, Loader2,
} from "lucide-react";

import { useAuth } from "../context/BlogAuthContext";
import { crawl } from "../lib/seo/crawler.js";
import { buildAudit } from "../lib/seo/siteAnalysis.js";
import { downloadHtml, downloadJson } from "../lib/seo/report.js";
import {
  saveAudit, listHistory, clearHistory, compareToPrevious,
  getIssueStatuses, setIssueStatus,
} from "../lib/seo/history.js";
import { fetchPage, parseHtml } from "../lib/seo/crawler.js";
import { analyzePage } from "../lib/seo/rules.js";
import { DEFAULT_CRAWL, SEVERITY, CATEGORY, SITE_ORIGIN } from "../lib/seo/constants.js";

const BRAND = "#FFC107";
const INK = "#111111";

// ════════════════════════════════════════════════════════════════════════
// ROOT — auth gate
// ════════════════════════════════════════════════════════════════════════

export default function SeoAuditApp() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <Centered><Loader2 className="spin" size={28} style={{ color: BRAND }} /></Centered>;
  if (!isAuthenticated) return <LoginGate />;
  return <AuditConsole />;
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
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setErr(""); setBusy(true);
    const r = await login(email, pw);
    setBusy(false);
    if (!r.success) setErr(r.message || "Login failed.");
  };
  return (
    <Centered>
      <div style={{ width: 340, background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Shield size={18} style={{ color: BRAND }} />
          <h1 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: INK }}>SEO Audit</h1>
        </div>
        <p style={{ fontSize: 12.5, color: "#6B7280", margin: "0 0 14px" }}>Sign in with your CMS account to continue.</p>
        <input type="email" placeholder="you@abhicabs24x7.com" value={email} onChange={(e) => setEmail(e.target.value)}
          style={inputStyle} autoFocus />
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} style={inputStyle} />
        {err && <div style={{ color: "#DC2626", fontSize: 12, margin: "6px 0" }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...primaryBtn, width: "100%", marginTop: 8, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <a href="/admin/blog-builder" style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: 12, color: "#6B7280" }}>Back to CMS</a>
      </div>
    </Centered>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CONSOLE
// ════════════════════════════════════════════════════════════════════════

function AuditConsole() {
  const { user, canEdit } = useAuth();
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;

  const [cfg, setCfg] = useState({
    maxPages: DEFAULT_CRAWL.maxPages,
    maxDepth: DEFAULT_CRAWL.maxDepth,
    concurrency: DEFAULT_CRAWL.concurrency,
    perRequestTimeoutMs: DEFAULT_CRAWL.perRequestTimeoutMs,
    startUrlsText: "",
    sitemapUrlsText: "",
    excludeText: "",
  });
  const [view, setView] = useState("dashboard");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [audit, setAudit] = useState(null);
  const [runErr, setRunErr] = useState("");
  const [history, setHistory] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [filter, setFilter] = useState({ severity: "all", category: "all", type: "all" });
  const tokenRef = useRef(null);

  useEffect(() => { setHistory(listHistory()); setStatuses(getIssueStatuses()); }, []);

  const linesToArr = (s) => (s || "").split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

  const run = useCallback(async () => {
    if (!canEdit) return;
    setRunning(true); setRunErr(""); setProgress({ checked: 0, discovered: 0, queued: 0, current: "" });
    const token = { cancelled: false };
    tokenRef.current = token;
    try {
      const result = await crawl(
        {
          origin,
          maxPages: Number(cfg.maxPages) || DEFAULT_CRAWL.maxPages,
          maxDepth: Number(cfg.maxDepth) || DEFAULT_CRAWL.maxDepth,
          concurrency: Math.min(Math.max(Number(cfg.concurrency) || 4, 1), 8),
          perRequestTimeoutMs: Number(cfg.perRequestTimeoutMs) || DEFAULT_CRAWL.perRequestTimeoutMs,
          startUrls: linesToArr(cfg.startUrlsText),
          sitemapUrls: linesToArr(cfg.sitemapUrlsText),
          exclude: linesToArr(cfg.excludeText),
        },
        { token, onProgress: (p) => setProgress(p) }
      );
      const a = buildAudit(result);
      setAudit(a);
      setHistory(saveAudit(a));
      setView("dashboard");
    } catch (e) {
      setRunErr(e?.message || "Audit failed to run.");
    } finally {
      setRunning(false);
      tokenRef.current = null;
    }
  }, [cfg, origin, canEdit]);

  const cancel = () => { if (tokenRef.current) tokenRef.current.cancelled = true; };

  // Recheck one improvement: refetch its affected URLs, re-run rules.
  const recheck = useCallback(async (item) => {
    if (!canEdit) return;
    setStatuses((s) => ({ ...s, [item.id]: { status: "rechecking", at: new Date().toISOString() } }));
    const urls = item.affectedUrls.slice(0, 25);
    let stillPresent = 0;
    for (const u of urls) {
      const t = await fetchPage(u, Number(cfg.perRequestTimeoutMs) || DEFAULT_CRAWL.perRequestTimeoutMs);
      const snap = parseHtml(t, origin);
      const findings = (snap.parsed || snap.status >= 400) ? analyzePage(snap) : [];
      if (findings.some((f) => f.ruleId === item.id)) stillPresent++;
    }
    const status = stillPresent === 0 ? "resolved" : "still-present";
    setIssueStatus(item.id, status);
    setStatuses(getIssueStatuses());
  }, [cfg.perRequestTimeoutMs, origin, canEdit]);

  const setStatus = (id, status) => { setIssueStatus(id, status); setStatuses(getIssueStatuses()); };

  const cmp = useMemo(() => compareToPrevious(history), [history]);

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", color: INK, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: INK, color: "#fff", padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: BRAND, display: "grid", placeItems: "center", color: INK, fontWeight: 900 }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>SEO Audit</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{origin}</div>
        </div>
        {!running ? (
          <button onClick={run} disabled={!canEdit} title={canEdit ? "" : "Viewer role: read-only"}
            style={{ ...primaryBtn, opacity: canEdit ? 1 : 0.5 }}>
            <Play size={14} /> Run audit
          </button>
        ) : (
          <button onClick={cancel} style={{ ...dangerBtn }}><Square size={13} /> Stop</button>
        )}
        <a href="/admin/blog-builder" style={{ color: "#9CA3AF", fontSize: 12, textDecoration: "none" }}>CMS →</a>
      </header>

      {/* Progress */}
      {running && progress && (
        <div style={{ background: "#FEF9E7", borderBottom: "1px solid #FDE68A", padding: "8px 18px", display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, color: "#92400E" }}>
          <Loader2 className="spin" size={14} />
          <span><b>{progress.checked}</b> checked · <b>{progress.discovered}</b> discovered · <b>{progress.queued}</b> queued</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.8 }}>{progress.current}</span>
          <span>cap {cfg.maxPages}</span>
        </div>
      )}
      {runErr && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "8px 18px", fontSize: 13 }}>{runErr}</div>}

      {/* Tabs */}
      <nav style={{ display: "flex", gap: 4, padding: "10px 14px 0", flexWrap: "wrap" }}>
        {[
          ["dashboard", "Dashboard", LayoutDashboard],
          ["urls", "URLs", ListChecks],
          ["improve", "Improvement Center", Link2],
          ["history", "History", HistoryIcon],
          ["settings", "Settings", SettingsIcon],
        ].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "none", borderRadius: "10px 10px 0 0", cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, background: view === id ? "#fff" : "transparent", color: view === id ? INK : "#6B7280" }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        {!audit && view !== "settings" && view !== "history" && (
          <EmptyState canEdit={canEdit} running={running} onRun={run} />
        )}

        {view === "dashboard" && audit && <Dashboard audit={audit} cmp={cmp} />}
        {view === "urls" && audit && <UrlTable audit={audit} filter={filter} setFilter={setFilter} />}
        {view === "improve" && audit && (
          <Improve audit={audit} statuses={statuses} canEdit={canEdit} onRecheck={recheck} onStatus={setStatus} />
        )}
        {view === "history" && <HistoryView history={history} onClear={() => { clearHistory(); setHistory([]); }} />}
        {view === "settings" && <SettingsView cfg={cfg} setCfg={setCfg} />}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// VIEWS
// ════════════════════════════════════════════════════════════════════════

function EmptyState({ canEdit, running, onRun }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: 40 }}>
      <Shield size={32} style={{ color: BRAND, marginBottom: 10 }} />
      <h2 style={{ margin: "0 0 6px", fontSize: 16 }}>No audit yet</h2>
      <p style={{ color: "#6B7280", fontSize: 13, maxWidth: 460, margin: "0 auto 14px" }}>
        The crawler reads your sitemap and robots.txt, then follows internal links on this site and checks every eligible page.
        External links and PageSpeed data can't be verified from the browser.
      </p>
      {canEdit
        ? <button onClick={onRun} disabled={running} style={{ ...primaryBtn, margin: "0 auto" }}><Play size={14} /> Run first audit</button>
        : <p style={{ fontSize: 12, color: "#9CA3AF" }}>Your role is read-only. Ask an editor to run an audit.</p>}
    </div>
  );
}

function Dashboard({ audit, cmp }) {
  const c = audit.coverage;
  const sc = audit.severityCounts;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* coverage banner */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {c.completed
          ? <Badge sev="pass"><CheckCircle size={12} /> Crawl completed</Badge>
          : <Badge sev="warning"><AlertTriangle size={12} /> Partial — {c.stopReason}</Badge>}
        <span style={{ fontSize: 12.5, color: "#374151" }}>
          {c.eligibleChecked} of {c.discovered} discovered URLs checked · {Math.round((c.durationMs || 0) / 1000)}s ·
          robots.txt {c.robotsFound ? "found" : "not found"} · {c.sitemapsFound.length} sitemap(s)
        </span>
        {cmp && (
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: cmp.totalDelta <= 0 ? "#059669" : "#DC2626" }}>
            {cmp.totalDelta <= 0 ? "▼" : "▲"} {Math.abs(cmp.totalDelta)} issues vs last run
          </span>
        )}
      </div>

      {/* severity stats */}
      <div style={grid}>
        <Stat n={sc.critical} label="Critical" color={SEVERITY.critical.color} />
        <Stat n={sc.error} label="Errors" color={SEVERITY.error.color} />
        <Stat n={sc.warning} label="Warnings" color={SEVERITY.warning.color} />
        <Stat n={sc.suggestion} label="Suggestions" color={SEVERITY.suggestion.color} />
        <Stat n={audit.brokenInternal.length} label="Broken links" color="#DC2626" />
        <Stat n={c.external} label="External (unverified)" color="#6B7280" />
      </div>

      {/* coverage breakdown */}
      <div style={card}>
        <H>Crawl coverage</H>
        <div style={grid}>
          <Stat n={c.discovered} label="Discovered" color={INK} />
          <Stat n={c.eligibleChecked} label="Checked" color={INK} />
          <Stat n={c.success} label="Clean" color="#059669" />
          <Stat n={c.withIssues} label="With issues" color="#D97706" />
          <Stat n={c.failed} label="Failed" color="#DC2626" />
          <Stat n={c.timeout} label="Timed out" color="#DC2626" />
          <Stat n={c.blocked} label="Blocked/excluded" color="#6B7280" />
          <Stat n={c.skipped} label="Skipped (cap)" color="#6B7280" />
        </div>
      </div>

      {/* page-type summaries */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <TypeCard title="Blog posts" s={audit.blogSummary} />
        <TypeCard title="Main pages" s={audit.mainSummary} />
      </div>

      {/* top shared-template issues */}
      <div style={card}>
        <H>Top shared-template issues</H>
        {audit.groups.slice(0, 6).map((g) => (
          <Row key={g.ruleId} sev={g.severity} title={g.title} right={`${g.count} page(s)`} sub={g.recommendation} />
        ))}
        {audit.groups.length === 0 && <Muted>No recurring issues found.</Muted>}
      </div>

      {/* export */}
      <div style={{ ...card, display: "flex", gap: 10, alignItems: "center" }}>
        <H style={{ margin: 0, flex: 1 }}>Export this audit</H>
        <button onClick={() => downloadHtml(audit)} style={ghostBtn}><FileText size={14} /> HTML</button>
        <button onClick={() => downloadJson(audit)} style={ghostBtn}><FileJson size={14} /> JSON</button>
      </div>
    </div>
  );
}

function UrlTable({ audit, filter, setFilter }) {
  const rows = audit.urlInventory.filter((r) =>
    (filter.type === "all" || r.pageType === filter.type) &&
    (filter.severity === "all" || (filter.severity === "issues" ? r.issueCount > 0 : filter.severity === "clean" ? r.issueCount === 0 : true))
  );
  const types = Array.from(new Set(audit.urlInventory.map((r) => r.pageType)));
  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <Select value={filter.type} onChange={(v) => setFilter({ ...filter, type: v })} options={[["all", "All types"], ...types.map((t) => [t, t])]} />
        <Select value={filter.severity} onChange={(v) => setFilter({ ...filter, severity: v })} options={[["all", "All"], ["issues", "With issues"], ["clean", "Clean"]]} />
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280", alignSelf: "center" }}>{rows.length} URL(s)</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6B7280" }}>
              <th style={th}>URL</th><th style={th}>Status</th><th style={th}>Outcome</th><th style={th}>Type</th><th style={th}>Issues</th><th style={th}>Response</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.url} style={{ borderTop: "1px solid #F3F4F6" }}>
                <td style={{ ...td, maxWidth: 420, wordBreak: "break-all" }}>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#2563EB", textDecoration: "none" }}>{r.url}</a>
                  {r.redirected && <span style={{ color: "#D97706" }}> → {r.redirectedTo}</span>}
                </td>
                <td style={td}><code style={{ color: r.status >= 400 ? "#DC2626" : r.status >= 300 ? "#D97706" : "#059669" }}>{r.status || "—"}</code></td>
                <td style={td}>{r.outcome}</td>
                <td style={td}>{r.pageType}</td>
                <td style={{ ...td, fontWeight: 700, color: r.issueCount ? "#D97706" : "#059669" }}>{r.issueCount}</td>
                <td style={td}>{r.responseTimeMs != null ? `${r.responseTimeMs} ms` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Improve({ audit, statuses, canEdit, onRecheck, onStatus }) {
  const [sev, setSev] = useState("all");
  const items = audit.improvements.filter((i) => sev === "all" || i.severity === sev);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...card, display: "flex", gap: 8, alignItems: "center" }}>
        <Select value={sev} onChange={setSev} options={[["all", "All severities"], ...Object.keys(SEVERITY).filter((s) => s !== "pass").map((s) => [s, SEVERITY[s].label])]} />
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>{items.length} recommendation(s), prioritized</span>
      </div>
      {items.map((it) => {
        const st = statuses[it.id]?.status || "detected";
        return (
          <div key={it.id} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Badge sev={it.severity}>{SEVERITY[it.severity].label}</Badge>
              <strong style={{ fontSize: 13.5 }}>{it.title}</strong>
              <span style={{ fontSize: 11, color: "#6B7280" }}>· {CATEGORY[it.category]?.label || it.category}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#6B7280" }}>{it.affectedCount} page(s) · {it.effort}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#374151", marginTop: 6, lineHeight: 1.6 }}>
              <p style={pLine}><b>Evidence:</b> {it.evidence}</p>
              <p style={pLine}><b>Why it matters:</b> {it.whyItMatters}</p>
              <p style={pLine}><b>What to change:</b> {it.whatToChange}</p>
              <p style={pLine}><b>Verify by:</b> {it.verifyBy}</p>
            </div>
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "#2563EB" }}>{it.affectedCount} affected URL(s)</summary>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 11.5, color: "#4B5563", maxHeight: 180, overflowY: "auto" }}>
                {it.affectedUrls.slice(0, 100).map((u) => <li key={u} style={{ wordBreak: "break-all" }}>{u}</li>)}
              </ul>
            </details>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
              <StatusPill status={st} />
              {canEdit && (
                <>
                  <button onClick={() => onStatus(it.id, "fix-applied")} style={miniBtn}>Mark fix applied</button>
                  <button onClick={() => onRecheck(it)} style={miniBtn} disabled={st === "rechecking"}>
                    <RefreshCw size={11} className={st === "rechecking" ? "spin" : ""} /> Recheck
                  </button>
                  <button onClick={() => onStatus(it.id, "dismissed")} style={{ ...miniBtn, color: "#6B7280" }}>Dismiss</button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div style={{ ...card, textAlign: "center", color: "#059669" }}>No recommendations at this severity 🎉</div>}
    </div>
  );
}

function HistoryView({ history, onClear }) {
  if (!history.length) return <div style={{ ...card, textAlign: "center", color: "#6B7280" }}>No past audits yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6B7280" }}>Stored in this browser only.</span>
        <button onClick={onClear} style={{ ...ghostBtn, marginLeft: "auto" }}>Clear history</button>
      </div>
      {history.map((h) => (
        <div key={h.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13 }}>{new Date(h.at).toLocaleString()}</strong>
            {h.partial && <Badge sev="warning">Partial</Badge>}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>{h.checked}/{h.discovered} checked · {h.totalIssues} issues · {h.brokenInternal} broken</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {Object.entries(h.severityCounts).map(([k, v]) => v > 0 && (
              <span key={k} style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 8px", borderRadius: 20, color: SEVERITY[k].color, background: SEVERITY[k].bg }}>{v} {SEVERITY[k].label}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsView({ cfg, setCfg }) {
  const set = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={card}>
        <H>Crawl limits</H>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Max pages"><input type="number" min={1} value={cfg.maxPages} onChange={set("maxPages")} style={inputStyle} /></Field>
          <Field label="Max depth"><input type="number" min={1} value={cfg.maxDepth} onChange={set("maxDepth")} style={inputStyle} /></Field>
          <Field label="Concurrency (1–8)"><input type="number" min={1} max={8} value={cfg.concurrency} onChange={set("concurrency")} style={inputStyle} /></Field>
          <Field label="Per-request timeout (ms)"><input type="number" min={1000} step={1000} value={cfg.perRequestTimeoutMs} onChange={set("perRequestTimeoutMs")} style={inputStyle} /></Field>
        </div>
      </div>
      <div style={card}>
        <H>URL sources & scope</H>
        <Field label="Extra start URLs (one per line)"><textarea rows={3} value={cfg.startUrlsText} onChange={set("startUrlsText")} style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="/landing/diwali-offer" /></Field>
        <Field label="Extra sitemap URLs (one per line)"><textarea rows={2} value={cfg.sitemapUrlsText} onChange={set("sitemapUrlsText")} style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="/blog-sitemap.xml" /></Field>
        <Field label="Exclude patterns (* wildcard, one per line)"><textarea rows={2} value={cfg.excludeText} onChange={set("excludeText")} style={{ ...inputStyle, fontFamily: "monospace" }} placeholder="*/checkout*&#10;*?utm_*" /></Field>
      </div>
      <div style={{ ...card, fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
        <H>Limits of a browser-only audit</H>
        Only this origin ({typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN}) is crawled — the auditor never requests another host.
        External links are reported as <b>unverified</b> because the browser can't read cross-origin responses.
        PageSpeed/Lighthouse field data and Search Console require backend integrations and aren't included here.
        History and issue status live in this browser's storage, not on a server.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SMALL UI
// ════════════════════════════════════════════════════════════════════════

const card = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 };
const th = { padding: "6px 8px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" };
const td = { padding: "6px 8px", verticalAlign: "top" };
const pLine = { margin: "2px 0" };
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid #D1D5DB", fontSize: 13, marginBottom: 8, boxSizing: "border-box" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: BRAND, color: INK, border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const dangerBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: "#DC2626", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: "#F3F4F6", color: INK, border: "1px solid #E5E7EB", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const miniBtn = { display: "inline-flex", alignItems: "center", gap: 4, background: "#F9FAFB", color: INK, border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" };

function H({ children, style }) { return <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10, ...style }}>{children}</div>; }
function Muted({ children }) { return <div style={{ fontSize: 12, color: "#9CA3AF" }}>{children}</div>; }
function Stat({ n, label, color }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{n}</div>
      <div style={{ fontSize: 10.5, color: "#6B7280", fontWeight: 600 }}>{label}</div>
    </div>
  );
}
function Badge({ sev, children }) {
  const s = SEVERITY[sev] || SEVERITY.info;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: s.color, background: s.bg, padding: "2px 9px", borderRadius: 20 }}>{children}</span>;
}
function Row({ sev, title, right, sub }) {
  const s = SEVERITY[sev] || SEVERITY.info;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderTop: "1px solid #F3F4F6" }}>
      <span style={{ width: 8, height: 8, borderRadius: 8, background: s.color, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#6B7280" }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: s.color }}>{right}</span>
    </div>
  );
}
function TypeCard({ title, s }) {
  return (
    <div style={card}>
      <H>{title}</H>
      <div style={{ display: "flex", gap: 14 }}>
        <Stat n={s.total} label="Total" color={INK} />
        <Stat n={s.withIssues} label="With issues" color="#D97706" />
        <Stat n={s.issues} label="Issues" color="#DC2626" />
      </div>
    </div>
  );
}
function StatusPill({ status }) {
  const map = {
    detected: ["#6B7280", "#F3F4F6", "Detected"],
    "fix-applied": ["#2563EB", "#EFF6FF", "Fix applied"],
    rechecking: ["#D97706", "#FFFBEB", "Rechecking…"],
    resolved: ["#059669", "#ECFDF5", "Resolved"],
    "still-present": ["#DC2626", "#FEF2F2", "Still present"],
    dismissed: ["#9CA3AF", "#F9FAFB", "Dismissed"],
  };
  const [color, bg, label] = map[status] || map.detected;
  return <span style={{ fontSize: 11, fontWeight: 800, color, background: bg, padding: "3px 10px", borderRadius: 20 }}>{label}</span>;
}
function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 4 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #D1D5DB", fontSize: 12.5, background: "#fff", cursor: "pointer" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
