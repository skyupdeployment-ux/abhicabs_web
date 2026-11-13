import { useAllPages } from "./usePageContent";
import { featuredServices } from "../lib/servicePage";

/**
 * Featured service pages for menus, footer, cards and related links: the five built-ins
 * plus every CMS page marked "Featured". Before the CMS loads (and on the server) this is
 * exactly the five defaults, so menus never flash empty.
 * → [{ href, label, short, mode, icon, desc, points, fromCms }]
 */
export default function useServiceLinks() {
  return featuredServices(useAllPages());
}
