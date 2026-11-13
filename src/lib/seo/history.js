/**
 * src/lib/seo/history.js — audit history in localStorage (per browser).
 *
 * Stores a compact SUMMARY of each run (not every page body) so history stays
 * small and comparable across runs. SSR-safe. There is no server persistence
 * client-side — that's a backend concern; this is the honest frontend version.
 */

const KEY = "abhicabs_seo_audit_history";
const MAX = 20;

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* quota */ }
}

export function summarize(audit) {
  return {
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    origin: audit.origin,
    severityCounts: audit.severityCounts,
    totalIssues: audit.totalIssues,
    checked: audit.coverage.eligibleChecked,
    discovered: audit.coverage.discovered,
    brokenInternal: audit.brokenInternal.length,
    partial: audit.coverage.partial,
    topIssues: audit.improvements.slice(0, 5).map((i) => ({ title: i.title, count: i.affectedCount, severity: i.severity })),
  };
}

export function saveAudit(audit) {
  const list = read();
  list.unshift(summarize(audit));
  write(list);
  return list;
}

export function listHistory() { return read(); }

export function clearHistory() { write([]); }

/** Diff against the immediately previous run, if any. */
export function compareToPrevious(list) {
  if (!list || list.length < 2) return null;
  const [cur, prev] = list;
  return {
    totalDelta: cur.totalIssues - prev.totalIssues,
    checkedDelta: cur.checked - prev.checked,
    brokenDelta: cur.brokenInternal - prev.brokenInternal,
    prevAt: prev.at,
  };
}

// ── Issue lifecycle status (per ruleId, per origin) ────────────────────────
const STATUS_KEY = "abhicabs_seo_issue_status";

export function getIssueStatuses() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}"); } catch { return {}; }
}
export function setIssueStatus(ruleId, status) {
  if (typeof window === "undefined") return;
  const all = getIssueStatuses();
  all[ruleId] = { status, at: new Date().toISOString() };
  try { localStorage.setItem(STATUS_KEY, JSON.stringify(all)); } catch { /* quota */ }
}
