/**
 * Single source of truth for Abhi Cabs contact details.
 *
 * Values mirror what the live Header/Footer already publish (phones, email,
 * WhatsApp), so the Contact page can never disagree with them. The Footer's
 * CMS "Site Settings" overrides (footer.phones / footer.email) are merged in
 * by useBusinessInfo().
 *
 * NOT invented: anything we do not have is `null` and the UI hides / adapts.
 *   - OFFICE_ADDRESS : set VITE_OFFICE_ADDRESS (full postal address)
 *   - MAPS_QUERY     : optional, defaults to the address
 *   - WhatsApp       : taken from the footer link (918096000182)
 */
// NOTE: Vite/Vike only inline *explicit* `import.meta.env.VITE_X` references (a dynamic
// `import.meta.env[key]` is replaced with null), so each variable is written out.
const clean = (v) => (v && String(v).trim() ? String(v).trim() : null);

export const PHONES = [
  { label: "+91 80960 00182", href: "tel:+918096000182" },
  { label: "+91 80960 00183", href: "tel:+918096000183" },
];

export const EMAIL = "support@abhicabs.com"; // same as Footer; CMS override supported

export const WHATSAPP_NUMBER = "918096000182"; // same as Footer
export const WHATSAPP_MESSAGE = "Hello Abhi Cabs, I would like to enquire about your cab services.";
export const whatsappHref = (number = WHATSAPP_NUMBER, text = WHATSAPP_MESSAGE) =>
  number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;

export const OFFICE_ADDRESS = clean(import.meta.env.VITE_OFFICE_ADDRESS);
const MAPS_QUERY = clean(import.meta.env.VITE_OFFICE_MAPS_QUERY) || OFFICE_ADDRESS;
export const mapsEmbedSrc = MAPS_QUERY
  ? `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`
  : null;
export const directionsHref = MAPS_QUERY
  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAPS_QUERY)}`
  : null;

export const SERVICE_AREA = "Karnataka & Hyderabad"; // as stated in Footer / site title

/**
 * Support hours. The site already promises 24×7 support in the header, footer,
 * services pages and structured data, so that is what is shown. If support
 * hours ever change, edit ONLY this block.
 */
export const SUPPORT_HOURS = {
  allDay: true, // 24×7
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  open: "12:00 AM",
  close: "11:59 PM",
  note: "Phone and WhatsApp support, every day including holidays.",
};

export const SUBJECTS = [
  "Booking Assistance",
  "General Enquiry",
  "Fare and Pricing Enquiry",
  "Trip-Related Support",
  "Feedback",
  "Complaint",
  "Corporate Enquiry",
  "Other",
];
