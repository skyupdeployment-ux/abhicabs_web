import { useSiteSettings } from "./useSiteSettings";
import { PHONES, EMAIL, WHATSAPP_NUMBER, OFFICE_ADDRESS, directionsHref, mapsEmbedSrc, whatsappHref } from "../data/businessInfo";

/** Business contact details, honouring Footer CMS overrides when present. */
export default function useBusinessInfo() {
  const s = useSiteSettings();
  const phones = s.getList("footer", "phones", PHONES).filter((p) => p?.href?.startsWith("tel:"));
  const emailHref = s.get("footer", "email", `mailto:${EMAIL}`);
  const email = String(emailHref).replace(/^mailto:/i, "").split("?")[0];
  return {
    phones,
    primaryPhone: phones[0] || null,
    email: email || null,
    emailHref: email ? `mailto:${email}` : null,
    whatsappHref: whatsappHref(WHATSAPP_NUMBER),
    address: OFFICE_ADDRESS,
    directionsHref,
    mapsEmbedSrc,
  };
}
