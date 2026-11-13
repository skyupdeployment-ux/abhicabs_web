import { CITY_CONTENT } from "../../../src/content/cityDefaults";

export function description(pageContext) {
  const slug = pageContext.routeParams?.slug;
  return CITY_CONTENT[slug]?.seo?.description || "Book cabs with Abhi Cabs 24\u00d77.";
}
