/**
 * src/lib/seo/report.js — HTML + JSON report export (client-side download).
 *
 * All dynamic text is HTML-escaped before it enters the report markup, so a
 * malicious title/description/URL discovered during a crawl can't inject
 * script into the downloaded report (spec §21: "Malicious HTML in reports").
 */

import { SEVERITY } from "./constants.js";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function triggerDownload(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

export function downloadJson(audit) {
  const payload = {
    generatedAt: new Date().toISOString(),
    origin: audit.origin,
    coverage: audit.coverage,
    severityCounts: audit.severityCounts,
    totalIssues: audit.totalIssues,
    improvements: audit.improvements,
    urlInventory: audit.urlInventory,
    brokenInternal: audit.brokenInternal,
    redirectingInternal: audit.redirectingInternal,
    duplicates: audit.duplicates,
    sitemapDiff: audit.sitemapDiff,
    orphans: audit.orphans,
    external: audit.external,
  };
  triggerDownload(`seo-audit-${stamp()}.json`, "application/json", JSON.stringify(payload, null, 2));
}

export function downloadHtml(audit) {
  const c = audit.coverage;
  const sevRow = Object.entries(audit.severityCounts)
    .map(([k, v]) => `<span class="pill" style="color:${SEVERITY[k].color};background:${SEVERITY[k].bg}">${v} ${esc(SEVERITY[k].label)}</span>`)
    .join(" ");

  const improvements = audit.improvements.map((it) => `
    <div class="card">
      <div class="card-h">
        <span class="sev" style="color:${SEVERITY[it.severity].color};background:${SEVERITY[it.severity].bg}">${esc(SEVERITY[it.severity].label)}</span>
        <strong>${esc(it.title)}</strong>
        <span class="muted">${it.affectedCount} page(s) · ${esc(it.effort)}</span>
      </div>
      <p><b>Evidence:</b> ${esc(it.evidence)}</p>
      <p><b>Why it matters:</b> ${esc(it.whyItMatters)}</p>
      <p><b>What to change:</b> ${esc(it.whatToChange)}</p>
      <p><b>Verify by:</b> ${esc(it.verifyBy)}</p>
      <details><summary>${it.affectedCount} affected URL(s)</summary>
        <ul>${it.affectedUrls.slice(0, 200).map((u) => `<li>${esc(u)}</li>`).join("")}</ul>
      </details>
    </div>`).join("");

  const inventory = audit.urlInventory.map((u) => `
    <tr>
      <td>${esc(u.url)}</td><td>${u.status}</td><td>${esc(u.outcome)}</td>
      <td>${esc(u.pageType)}</td><td>${u.issueCount}</td>
      <td>${u.responseTimeMs != null ? u.responseTimeMs + " ms" : "—"}</td>
    </tr>`).join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SEO Audit — ${esc(audit.origin)}</title>
<style>
  :root{color-scheme:light}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:24px;background:#F9FAFB;color:#111827}
  h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px;border-bottom:2px solid #FFC107;padding-bottom:4px}
  .muted{color:#6B7280;font-size:12px}
  .pill,.sev{display:inline-block;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;margin-right:4px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
  .stat{background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:10px}
  .stat b{display:block;font-size:20px}
  .card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin:8px 0}
  .card-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
  .card p{margin:3px 0;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:12px;background:#fff}
  th,td{border:1px solid #E5E7EB;padding:6px 8px;text-align:left;word-break:break-all}
  th{background:#F3F4F6}
  details{margin-top:6px}summary{cursor:pointer;color:#2563EB;font-size:12px}
</style></head><body>
  <h1>SEO Audit Report</h1>
  <div class="muted">${esc(audit.origin)} · generated ${esc(new Date().toLocaleString())}</div>
  <div class="muted">Crawl ${c.completed ? "completed" : "PARTIAL — " + esc(c.stopReason)} · ${c.eligibleChecked} pages checked of ${c.discovered} discovered · ${Math.round((c.durationMs || 0) / 1000)}s</div>

  <h2>Summary</h2>
  <div>${sevRow}</div>
  <div class="grid">
    <div class="stat"><b>${c.discovered}</b>URLs discovered</div>
    <div class="stat"><b>${c.eligibleChecked}</b>Pages checked</div>
    <div class="stat"><b>${c.success}</b>Clean</div>
    <div class="stat"><b>${c.withIssues}</b>With issues</div>
    <div class="stat"><b>${c.failed}</b>Failed</div>
    <div class="stat"><b>${c.timeout}</b>Timed out</div>
    <div class="stat"><b>${audit.brokenInternal.length}</b>Broken internal links</div>
    <div class="stat"><b>${c.external}</b>External links (unverified)</div>
  </div>

  <h2>Improvement Center (${audit.improvements.length})</h2>
  ${improvements || "<p class='muted'>No issues found.</p>"}

  <h2>URL Inventory (${audit.urlInventory.length})</h2>
  <table><thead><tr><th>URL</th><th>Status</th><th>Outcome</th><th>Type</th><th>Issues</th><th>Response</th></tr></thead>
  <tbody>${inventory}</tbody></table>

  <p class="muted" style="margin-top:24px">Generated by the AbhiCabs client-side SEO auditor. External links are marked unverified because the browser cannot read cross-origin responses; PageSpeed/Search Console data require backend integrations.</p>
</body></html>`;

  triggerDownload(`seo-audit-${stamp()}.html`, "text/html", html);
}
