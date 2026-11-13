import ServiceLanding from "../../../src/components/ServiceLanding";
import { LANDING_PAGES } from "../../../src/content/landingPages";

// SEO landing page — content lives in src/content/landingPages.js ("tempo-traveller").
export default function Page() { return <ServiceLanding cfg={LANDING_PAGES["tempo-traveller"]} />; }
