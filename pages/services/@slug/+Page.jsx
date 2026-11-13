import { usePageContext } from "vike-react/usePageContext";
import ServicePageView from "../../../src/components/ServicePageView";

/** /services/:slug — any page created in the CMS (fixed template, dynamic content). */
export default function Page() {
  const slug = usePageContext().routeParams?.slug || "";
  return <ServicePageView slug={slug} />;
}
