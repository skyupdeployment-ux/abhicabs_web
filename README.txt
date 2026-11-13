FULL HOMEPAGE EDITING — STAGE 1: STRUCTURE (reorder + show/hide)
Frontend only. Fallback-safe: with no saved layout the homepage renders
exactly as before.

WHAT YOU CAN DO NOW
  Open the builder → Home. A new "Page layout" panel lists all 16 built-in
  sections (trust badges, service strip, fleet, routes, reviews, FAQ, CTA …).
  Reorder them with ↑ / ↓ and show/hide each with the Shown/Hidden toggle.
  Click Save, then Refresh the live preview frame to see the new arrangement.
  (The hero + booking engine stays pinned at the top.)

HOW IT WORKS
  pages/index/+Page.jsx renders the built-in sections from a CMS layout
  (page._layout) instead of a fixed list; each section keeps its exact design.
  src/hooks/usePageContent.js — new getLayout() resolves the saved order,
  drops unknown keys, and appends any new section so nothing disappears.
  src/pages/BlogBuilder.jsx — the "Page layout" editor (reorder + show/hide),
  saved into the page like any other content via PUT /api/v1/blog/pages.

ALSO INCLUDED (from the prior drops, needed for a consistent apply)
  - Hero background image is CMS-driven (HeroSection.jsx) + seeded.
  - SEO check no longer false-flags main pages (PageSeoAnalyzer.jsx).
  - Live preview frame + journey-category WebP refs (BlogBuilder / pages index).

STILL TO COME (the rest of "full")
  Stage 2 — edit each section's TEXT (headings, sub-text, button labels).
  Stage 3 — edit each section's ITEMS (routes, reviews, FAQ, stats, journey…).
  The render side is already wired to accept both; these stages add the
  per-section editors in the builder. No further homepage rewrite needed.

Requires the backend /api/v1/blog/pages endpoint (from the earlier full-stack
update) deployed, so the layout persists.
