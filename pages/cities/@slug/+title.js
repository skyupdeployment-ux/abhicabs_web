import { CITY_CONTENT } from "../../../src/content/cityDefaults";

export function title(pageContext) {
  const slug = pageContext.routeParams?.slug;
  return CITY_CONTENT[slug]?.seo?.title || "Abhi Cabs";
}
