import ServiceLanding from "../../../src/components/ServiceLanding";
import { LANDING_PAGES } from "../../../src/content/landingPages";

// SEO landing page — content lives in src/content/landingPages.js ("bangalore-car-rental").
export default function Page() { return <ServiceLanding cfg={LANDING_PAGES["bangalore-car-rental"]} />; }
