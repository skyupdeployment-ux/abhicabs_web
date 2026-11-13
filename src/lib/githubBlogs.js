/**
 * Live access to the blog posts file (src/data/blogs.js) through the GitHub API.
 * The Blog Builder publishes by committing to this file, so GitHub — not the bundle that
 * was built into the running app — is the source of truth for what exists and can be edited.
 *
 * Needs VITE_GH_TOKEN (a token with repo contents read/write). The repo defaults to this project's own;
 * VITE_GH_REPO ("owner/repo") overrides it.
 * Written with explicit `import.meta.env.VITE_*` references (dynamic access is not inlined).
 */
export const GH_TOKEN = import.meta.env.VITE_GH_TOKEN;
// Default = this project's own repository (from .git/config). Override with VITE_GH_REPO if it ever moves.
export const GH_REPO = import.meta.env.VITE_GH_REPO || "skyupdigitalsolutions-cpu/abhicabs-customer-website";
export const GH_BRANCH = "main";
export const GH_FILE = "src/data/blogs.js";

export const ghConfigured = () => !!GH_TOKEN && !!GH_REPO;

/** → { sha, blogsArray }. Throws an Error whose message says what is wrong (token / repo / file). */
export async function fetchBlogsFile() {
  if (!GH_TOKEN) throw new Error("VITE_GH_TOKEN is not set.");
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}&t=${Date.now()}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github.v3+json" }, cache: "no-store",
  });
  if (res.status === 401) throw new Error("GitHub rejected the token (401). Check VITE_GH_TOKEN.");
  if (res.status === 403) throw new Error("GitHub denied access or rate-limited the request (403).");
  if (res.status === 404) throw new Error(`Not found (404): check VITE_GH_REPO “${GH_REPO}”, the “${GH_BRANCH}” branch and ${GH_FILE}.`);
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText}`);
  const file = await res.json();
  const text = new TextDecoder("utf-8").decode(Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
  const body = text.replace(/^[\s\S]*?export\s+const\s+BLOGS\s*=\s*/, "").replace(/;?\s*$/, "").trim();
  // eslint-disable-next-line no-new-func
  const blogsArray = new Function(`return ${body || "[]"}`)();
  if (!Array.isArray(blogsArray)) throw new Error("blogs.js doesn't export a BLOGS array.");
  return { sha: file.sha, blogsArray };
}
