import { CITY_CONTENT } from "../../../src/content/cityDefaults";

/**
 * Tell Vike which /cities/<slug> URLs to prerender at build time.
 * Without this, the parameterized route has no static HTML and
 * Netlify's catch-all redirect serves 404.html instead.
 */
export function prerender() {
  return Object.keys(CITY_CONTENT).map((slug) => `/cities/${slug}`);
}