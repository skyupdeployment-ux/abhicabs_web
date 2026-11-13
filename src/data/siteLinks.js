/**
 * Every internal route and nav/footer link lives here — one place to edit.
 * Header, Footer, service pages and the Contact page all import from this file,
 * so a link can't be right in one place and dead in another.
 * (Header/Footer still accept CMS overrides from Site Settings.)
 */
export const ROUTES = {
  home: "/",
  booking: "/#booking",
  about: "/about",
  fleet: "/fleet",
  services: "/services",
  blogs: "/blogs",
  contact: "/contact-us",
  contactForm: "/contact-us#contact-form",
  myBooking: "/my-booking",
  supportTickets: "/support-tickets",
  privacy: "/privacy",
  terms: "/terms",
  cancellation: "/cancellation",
};

export const contactFormHref = (subject) => `/contact-us?subject=${encodeURIComponent(subject)}#contact-form`;

export const SERVICE_LINKS = [
  { href: "/services/local", label: "Local Taxi Services", short: "Local Rental", mode: "local" },
  { href: "/services/airport-taxi", label: "Airport Taxi", short: "Airport Taxi", mode: "airport" },
  { href: "/services/one-way-outstation", label: "One-Way Outstation", short: "One Way", mode: "one-way" },
  { href: "/services/round-trip", label: "Round Trip Services", short: "Round Trip", mode: "round-trip" },
  { href: "/services/corporate", label: "Corporate Transportation", short: "Corporate", mode: null },
];

export const NAV_LINKS = [
  { href: "/services/local", label: "Car Rental" },
  { href: ROUTES.fleet, label: "Vehicle Rental" },
  { href: "/outstation", label: "Outstation Cabs" },
  { href: "/services/airport-taxi", label: "Airport Cabs" },
  { href: "/services/round-trip", label: "Intercity Cabs" },
  { href: ROUTES.blogs, label: "Blogs" },
  { href: ROUTES.contact, label: "Contact" },
];

export const FOOTER_COLUMNS = [
  {
    title: "Quick Links",
    links: [
      ["Home", ROUTES.home],
      ["About", ROUTES.about],
      ["Our Fleet", ROUTES.fleet],
      ["Tempo Traveller", "/vehicles/tempo-traveller"],
      ["All Services", ROUTES.services],
      ["Blogs", ROUTES.blogs],
      ["Contact Us", ROUTES.contact],
    ],
  },
  {
    title: "Services",
    links: SERVICE_LINKS.map((s) => [s.short, s.href]),
  },
  {
    title: "Destinations",
    links: [
      ["Bangalore", "/bangalore/car-rental"],
      ["Mangaluru", "/cities/mangaluru"],
      ["Pune", "/cities/pune"],
      ["Tirupati", "/cities/tirupati"],
      ["Visakhapatnam", "/cities/visakhapatnam"],
      ["Outstation Cabs", "/outstation"],
    ],
  },
];

export const LEGAL_LINKS = [
  ["Privacy Policy", ROUTES.privacy],
  ["Terms", ROUTES.terms],
  ["Cancellation Policy", ROUTES.cancellation],
];

/** True when `href` is the page we're on (Home matches only "/"). */
export const isActivePath = (href, path = "/") => {
  const base = href.split("#")[0].split("?")[0] || "/";
  return base === "/" ? path === "/" : path === base || path.startsWith(base + "/");
};
