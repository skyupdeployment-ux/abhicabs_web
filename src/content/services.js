/** Default copy for /services. The CMS (page id "services") can override hero / faq / cta and order. */
import { SERVICE_LINKS } from "../data/siteLinks";

const link = (mode) => SERVICE_LINKS.find((s) => s.mode === mode) || SERVICE_LINKS[4];

export const SERVICES_ORDER = ["overview", "why", "how", "routes", "faq"];

export const SERVICES = {
  hero: {
    image: "/images/tea-garden-road.jpg",
    title: "Every ride,", accent: "one trusted service",
    description: "Local rentals, airport transfers, outstation trips and corporate travel — the same verified drivers, transparent fares and 24×7 support behind every one.",
    stats: [["5", "Service types"], ["25+", "Cities covered"], ["250+", "Outstation routes"], ["24×7", "Support"]],
  },
  overview: {
    eyebrow: "What We Offer", title: "Pick the service that fits your trip",
    description: "Five ways to travel with Abhi Cabs — local, airport, one-way, round trip and corporate — with the fare shown before you book.",
    items: [
      { icon: "clock", ...pickLink("local"), title: "Local Taxi & Rentals", desc: "Hourly and full-day packages for city errands, meetings, shopping and events — with a car and driver on standby.", points: ["4hr / 8hr / 12hr packages", "Multiple stops, your schedule", "AC sedans & SUVs"] },
      { icon: "plane", ...pickLink("airport"), title: "Airport Transfers", desc: "Pickups and drops for Kempegowda, Hyderabad and the other airports listed in the booking form.", points: ["Fare shown before you book", "Choose your airport and direction", "Book ahead for early flights"] },
      { icon: "navigation", ...pickLink("one-way"), title: "One-Way Outstation", desc: "Single-direction intercity trips. Enter your route, add stops and see the fare before you confirm.", points: ["Single-direction intercity travel", "Add stops along the route", "Verified outstation drivers"] },
      { icon: "repeat", ...pickLink("round-trip"), title: "Round Trip & Multi-Day", desc: "Return journeys and multi-day tours with the same driver — ideal for weekend getaways and family trips.", points: ["Same trusted driver throughout", "Driver stay & allowances clear", "Flexible day-by-day plans"] },
      { icon: "building", ...pickLink(null), title: "Corporate Transport", desc: "Employee commute, client pickups and event logistics on monthly billing with a dedicated account manager.", points: ["GST invoicing & monthly billing", "Priority support desk", "Fleet for teams & events"] },
    ],
    helper: { title: "Not sure which to pick?", desc: "Tell us where you're going and we'll quote the right option instantly.", cta: "Get an instant quote" },
  },
  why: {
    eyebrow: "Why AbhiCabs", title: "The same standards behind every service",
    items: [
      { icon: "price", title: "Transparent fares", desc: "The quote you see is the price you pay. Tolls and parking at actuals — nothing hidden." },
      { icon: "shield", title: "Verified drivers", desc: "KYC-checked, background-verified and rated by real riders after every trip." },
      { icon: "pin", title: "Live tracking", desc: "Follow your cab in real time and share the trip link so family can too." },
      { icon: "phone", title: "24×7 real support", desc: "A real person answers — call, WhatsApp or email at any hour." },
    ],
  },
  how: {
    eyebrow: "How It Works", title: "Booked in under a minute",
    steps: [
      { title: "Tell us your trip", desc: "Pick the service, enter pickup, drop and time." },
      { title: "Get an instant fare", desc: "See the full price up front — no estimates, no surprises." },
      { title: "Confirm in seconds", desc: "Book online or as a guest; pay online or on trip." },
      { title: "Ride with confidence", desc: "A verified driver arrives on time. Track the whole way." },
    ],
  },
  routes: {
    eyebrow: "Popular Routes", title: "Most-booked journeys from Bangalore",
    items: [
      { from: "Bangalore", to: "Mysore", km: 150, hr: "3", img: "/images/route-1.webp" },
      { from: "Bangalore", to: "Coorg", km: 260, hr: "5", img: "/images/route-2.webp" },
      { from: "Bangalore", to: "Ooty", km: 280, hr: "6", img: "/images/route-3.webp" },
      { from: "Bangalore", to: "Tirupati", km: 250, hr: "4.5", img: "/images/route-1.webp" },
      { from: "Bangalore", to: "Goa", km: 560, hr: "9", img: "/images/route-4.webp" },
      { from: "Bangalore", to: "Hampi", km: 340, hr: "6", img: "/images/route-6.webp" },
    ],
  },
  faqsHeading: { eyebrow: "FAQ", title: "Service questions, answered" },
  faqs: [
    { q: "Which services does AbhiCabs offer?", a: "Local hourly rentals, airport transfers, one-way and round-trip outstation travel, and corporate transport — across Karnataka, Telangana, Andhra Pradesh and Maharashtra." },
    { q: "How do I see the fare before I book?", a: "The fare shown in the booking flow is the fare you confirm. Tolls and parking are billed at actuals." },
    { q: "Can I book a cab that starts outside Karnataka, Andhra Pradesh, Telangana or Maharashtra?", a: "Trips that start in Karnataka, Andhra Pradesh, Telangana or Maharashtra get a normal availability check. If your pickup is in another state, you can submit a booking request instead — our team reviews it and confirms it, so it is not a confirmed booking until you hear from us." },
    { q: "What is the difference between a one-way cab and a round-trip cab?", a: "A one-way cab takes you from your pickup to your drop and the trip ends there; a round-trip cab takes you out and back with the same driver. Enter your route under each to compare the fares for your dates." },
    { q: "Can I book a cab by the hour?", a: "Yes. Local packages are available for 4, 8 or 12 hours — choose the one that fits your plans in the booking form." },
    { q: "Can I book a Tempo Traveller or a larger vehicle for a group?", a: "Yes. Group vehicles are booked through an enquiry — share your date, route and group size and our team will confirm availability and a quote." },
    { q: "Can I book without creating an account?", a: "Yes — you can book as a guest. Creating an account just makes rebooking and tracking faster." },
    { q: "Do you provide GST invoices for business travel?", a: "Yes. Corporate accounts get GST invoicing and monthly billing with a dedicated account manager." },
    { q: "How early should I book an airport transfer?", a: "Any time works, but for early-morning flights we recommend booking the night before so the driver is confirmed and nearby." },
  ],
  cta: {
    line1: "Ready to Start", line2: "Your Journey?", primaryLabel: "Book Your Ride",
    description: "Choose your preferred service and experience convenient travel with Abhi Cabs. Wherever you're going, we're here to help make your journey easier.",
  },
};

function pickLink(mode) {
  const l = link(mode);
  return { href: l.href, mode: l.mode };
}
