import CityLanding from "../../../src/components/CityLanding";
import { usePageContext } from "vike-react/usePageContext";
import { CITY_CONTENT } from "../../../src/content/cityDefaults";

export default function Page() {
  const { routeParams } = usePageContext();
  const slug = routeParams?.slug;
  const city = CITY_CONTENT[slug];
  if (!city) return <div className="py-20 text-center text-text-secondary">City not found.</div>;
  return <CityLanding cfg={city} />;
}
