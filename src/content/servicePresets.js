/**
 * Page types for the CMS "New service page" popup — the pattern big cab sites use:
 * one fixed template, many pages (a city car-rental page, a city airport-taxi page,
 * a route page, a group-vehicle page …). A preset only fills the template's CONTENT.
 *
 * Rules the copy follows (so a bulk-created page is never misleading):
 *  - no prices, distances, durations or availability claims — those come from the live booking form;
 *  - only facts the site already states elsewhere (local 4/8/12 hr packages, one-way/round trip,
 *    tolls & parking at actuals, 12/17-seater Tempo Travellers, coaches up to 33 seats …).
 * Pages are written in Abhi Cabs' own words.
 */
import { newServiceContent } from "../lib/servicePage";
import { OPERATING_STATES, classifyOrigin, stateOfPlace } from "../data/serviceCoverage";

const faq = (q, a) => ({ q, a });
const step = (title, desc) => ({ title, desc });
const STEPS = [step("Enter your trip", "Add pickup, drop, date and time."), step("See the fare", "Get the full price before you book."), step("Choose a vehicle", "Pick the car that suits your group."), step("Confirm & ride", "A verified driver arrives on time.")];
const FEATURES = [
  { icon: "shield", title: "Verified drivers", desc: "KYC-checked, background-verified chauffeurs." },
  { icon: "price", title: "Transparent fares", desc: "See the fare before you confirm — nothing hidden." },
  { icon: "car", title: "Clean, comfortable cars", desc: "A well-maintained fleet, AC and non-AC." },
  { icon: "phone", title: "Real people to help", desc: "Reach our team before, during and after your ride." },
];

/** Start from the template defaults, then override. */
const make = (label, mode, group, o) => {
  const c = newServiceContent(label, mode, group);
  return {
    ...c, listing: "directory", enquirySubject: o.enquirySubject || "corporate", icon: o.icon || "car",
    hero: { ...c.hero, heading: o.h1, description: o.lead, image: o.image || c.hero.image },
    intro: { ...c.intro, eyebrow: o.eyebrow, heading: o.introHeading, body: o.body, bullets: o.bullets, image: o.introImage || c.intro.image },
    features: { heading: o.featuresHeading, items: FEATURES },
    pricing: { heading: o.pricingHeading, description: "The exact, all-inclusive fare is shown in the booking form before you confirm.", points: o.pricing },
    how: { heading: o.howHeading || "How booking works", steps: STEPS },
    routes: o.routes || [],
    faqs: o.faqs,
    cta: { line1: o.ctaA, line2: o.ctaB, description: o.ctaText },
    seo: { title: o.seoTitle, description: o.seoDesc },
  };
};

export const SERVICE_PRESETS = [
  {
    id: "city-car-rental", label: "City — Car rental", input: "city", group: "Car Rental Services", pattern: "Car rental in {city}",
    hint: "Local, airport and outstation in one page, for a city you serve.",
    build: ({ city }, label) => make(label, "one-way", "Car Rental Services", {
      icon: "car", eyebrow: "Car rental", h1: `Car Rental in ${city}`,
      lead: `Chauffeur-driven cars in ${city} for local trips, airport transfers and outstation journeys — book online with the fare shown up front.`,
      introHeading: `A car and driver in ${city}, whenever you need one`,
      body: [`Whether you need a car for a few hours around ${city}, a ride to the airport or a trip to another city, Abhi Cabs sends a verified driver in a clean, comfortable car.`, "Pick what suits the day — a local package, an airport pickup or drop, or an outstation trip (one-way or round trip) — and see the fare before you confirm."],
      bullets: ["Local packages — 4, 8 or 12 hours", "Airport pickups and drops", "Outstation one-way and round trips", "AC sedans, SUVs and larger vehicles"],
      featuresHeading: `Why rent a car in ${city} with Abhi Cabs`, pricingHeading: `What affects your car rental fare in ${city}`,
      pricing: ["The service: local, airport or outstation", "Package hours and included kilometres (local)", "Distance travelled (outstation)", "Vehicle category", "Tolls & parking at actuals"],
      faqs: [
        faq(`Can I rent a car with a driver in ${city}?`, "Yes — every booking comes with a verified driver. Choose a local package, an airport transfer or an outstation trip in the booking form above."),
        faq(`What local packages are available in ${city}?`, "Hourly and full-day packages with included kilometres. The exact options and rates appear in the booking flow."),
        faq(`Can I book an outstation trip from ${city}?`, "Yes — one-way or round trip. Enter your pickup and destination to see the fare."),
        faq("Do I need an account to book?", "No — you can book as a guest. An account just makes rebooking and tracking faster."),
      ],
      ctaA: "Need a car", ctaB: `in ${city}?`, ctaText: "See your fare and book in under a minute.",
      seoTitle: `Car Rental in ${city} | Chauffeur-Driven Cabs | Abhi Cabs`, seoDesc: `Rent a car with a verified driver in ${city} — local packages, airport transfers and outstation trips with the fare shown before you book.`,
    }),
  },
  {
    id: "city-taxi", label: "City — Taxi service", input: "city", group: "Book Taxi Services", pattern: "{city} Taxi Service",
    hint: "A general “book a taxi in <city>” page.",
    build: ({ city }, label) => make(label, "one-way", "Book Taxi Services", {
      icon: "car", eyebrow: "Taxi service", h1: `${city} Taxi Service`,
      lead: `Book a reliable taxi in ${city} — verified drivers, clean cars and fares you can see before you confirm.`,
      introHeading: `Book a taxi in ${city} in under a minute`,
      body: [`Abhi Cabs makes it easy to get a cab in ${city} for city rides, airport trips and journeys to other cities.`, "Enter your trip, compare the fare and confirm — you can even book as a guest.", "Every ride comes with a verified, rated driver, a clean car and support that picks up when you call."],
      bullets: ["Verified, rated drivers", "Fares shown before you book", "Book as a guest, pay online or on trip", "Real support, any hour"],
      featuresHeading: `Why book a taxi in ${city} with us`, pricingHeading: `Understand taxi fares in ${city}`,
      pricing: ["Distance or package chosen", "Vehicle category", "Pickup date and time", "Tolls & parking at actuals"],
      faqs: [
        faq(`How do I book a taxi in ${city}?`, "Enter your pickup, drop, date and time in the booking form, pick a vehicle and confirm."),
        faq("Can I schedule a cab in advance?", "Yes — choose any future date and time when booking."),
        faq("What payment options are available?", "Online payment or pay on trip, as shown at checkout."),
      ],
      ctaA: "Ready to ride", ctaB: `in ${city}?`, ctaText: "Book your taxi now.",
      seoTitle: `${city} Taxi Service | Book a Cab Online | Abhi Cabs`, seoDesc: `Book a taxi in ${city} with verified drivers and transparent fares. Choose local, airport or outstation cabs and see the fare before you confirm.`,
    }),
  },
  {
    id: "city-airport", label: "City — Airport taxi", input: "city", group: "Airport Taxi Services", pattern: "Airport Taxi in {city}",
    hint: "Airport pickups and drops for a city.",
    build: ({ city }, label) => make(label, "airport", "Airport Taxi Services", {
      icon: "plane", eyebrow: "Airport taxi", h1: `Airport Taxi in ${city}`,
      lead: `On-time airport pickups and drops in ${city} with the fare shown before you book.`,
      introHeading: `Reach your flight, or your home, without the stress`,
      body: [`Book an airport cab in ${city} for departures and arrivals. Pick your airport and direction in the booking form and see the fare before you confirm.`, "For early-morning flights, book the night before so your driver is confirmed and nearby."],
      bullets: ["Pickups and drops", "Fare shown before you book", "Terminal details in the booking form", "Support when you need it"],
      featuresHeading: `Why choose our ${city} airport cabs`, pricingHeading: `What affects your airport taxi fare`,
      pricing: ["Airport and direction (pickup or drop)", "Your pickup or drop location", "Vehicle category", "Pickup date and time"],
      howHeading: "How to book an airport cab",
      faqs: [
        faq(`How do I book an airport taxi in ${city}?`, "Choose the Airport tab in the booking form, select the airport and direction, add your address and time, then confirm."),
        faq("How early should I book?", "Any time works, but for early-morning flights we recommend booking the night before."),
        faq("Can I book for someone else?", "Yes — add the passenger's pickup details when you book."),
      ],
      ctaA: "Flying out", ctaB: "soon?", ctaText: "Book your airport cab in under a minute.",
      seoTitle: `Airport Taxi in ${city} | Pickup & Drop | Abhi Cabs`, seoDesc: `Book an airport taxi in ${city} — on-time pickups and drops with verified drivers, with the fare shown up front before you confirm your ride.`,
    }),
  },
  {
    id: "city-local", label: "City — Local rental (hourly)", input: "city", group: "Local Taxi Services", pattern: "Local Taxi in {city}",
    hint: "Hourly and full-day local rentals.",
    build: ({ city }, label) => make(label, "local", "Local Taxi Services", {
      icon: "clock", eyebrow: "Local taxi", h1: `Local Taxi in ${city}`,
      lead: `Hourly and full-day cab rentals in ${city} — a car and driver on standby for as long as you need.`,
      introHeading: "A cab that waits while you don't",
      body: [`Keep a car and driver with you around ${city} for errands, meetings, shopping or sightseeing — stop wherever you like without re-booking.`, "Choose a half-day, full-day or extended package and see the fare before you confirm. Your driver stays with you for the whole booking."],
      bullets: ["4, 8 or 12 hour packages", "Multiple stops on one booking", "AC sedans & SUVs", "Verified, rated drivers"],
      featuresHeading: `Why take a local rental in ${city}`, pricingHeading: "Understand local rental costs",
      pricing: ["Package duration (4, 8 or 12 hours)", "Included kilometres", "Extra hours or km beyond the package", "Vehicle category", "Tolls & parking at actuals"],
      faqs: [
        faq("What local packages are available?", "Hourly and full-day packages with included kilometres. Exact options and rates appear in the booking flow."),
        faq("Can I make multiple stops?", "Yes — a local rental stays with you, so you can add stops without re-booking."),
        faq("What happens if I exceed the package?", "Extra hours or kilometres are charged at the applicable rate, shown up front."),
      ],
      ctaA: "Need a cab", ctaB: "for the day?", ctaText: "Book a local rental and travel on your schedule.",
      seoTitle: `Local Taxi in ${city} | Hourly Car Rental | Abhi Cabs`, seoDesc: `Hourly and full-day local cab rentals in ${city} with verified drivers and transparent fares. Choose a 4, 8 or 12 hour package and book online.`,
    }),
  },
  {
    id: "state-service", label: "State — Cab service", input: "state", group: "State Cab Services", pattern: "Cab Service in {state}",
    hint: "One page per operating state (Karnataka, Andhra Pradesh, Telangana, Maharashtra). All the state's cab/taxi/outstation/airport phrases share this one page — no duplicate pages.",
    build: ({ state }, label) => make(label, "one-way", "State Cab Services", {
      icon: "pin", eyebrow: "Cab service", h1: `Cab Service in ${state}`,
      lead: `Book local, airport and outstation cabs from anywhere in ${state} with Abhi Cabs — with the fare shown before you confirm.`,
      introHeading: `Cabs across ${state}`,
      body: [`Abhi Cabs picks up across ${state} for local trips, airport transfers and outstation journeys, one-way or round trip. Enter your pickup and drop in the booking form to check availability and see the fare.`,
             `Your trip can start in ${state} and end in another state, subject to the route, vehicle and date. You can add stops along the way and choose a vehicle that suits your group.`],
      bullets: ["Local packages — 4, 8 or 12 hours", "Airport pickups and drops", "Outstation one-way and round trips", "Group vehicles by enquiry"],
      featuresHeading: `Why travel with Abhi Cabs in ${state}`, pricingHeading: "What affects your fare",
      pricing: ["The service: local, airport or outstation", "Distance or package hours", "Vehicle category", "Tolls & parking at actuals"],
      faqs: [
        faq(`Can I book a cab in ${state}?`, `Yes. Trips that start in ${state} get an availability check as normal — enter your route in the booking form to see the fare. Availability depends on the route, vehicle and date.`),
        faq(`Can my trip from ${state} end in another state?`, "Yes. It is the pickup that decides, and your drop can be in another state, subject to the route, vehicle and date."),
        faq("Can I book a cab that starts outside Karnataka, Andhra Pradesh, Telangana or Maharashtra?", "You can submit a booking request instead. Our team reviews it and confirms it — it is not a confirmed booking until you hear from us."),
        faq("Which services can I book?", "Local cabs (4, 8 or 12 hour packages), airport transfers, one-way and round-trip outstation cabs, and group vehicles by enquiry."),
      ],
      ctaA: "Need a cab", ctaB: `in ${state}?`, ctaText: "Enter your route and see the fare.",
      seoTitle: (`Cab Service in ${state} | Outstation, Local & Airport | Abhi Cabs`.length <= 60) ? `Cab Service in ${state} | Outstation, Local & Airport | Abhi Cabs` : `Cab Service in ${state} | Abhi Cabs`,
      seoDesc: `Book local, airport and outstation cabs from anywhere in ${state} with Abhi Cabs. Enter your route to check availability and see the fare before you confirm.`,
    }),
  },
  {
    id: "route", label: "Route — A to B cab", input: "route", group: "Popular Routes", pattern: "{from} to {to} Cab",
    hint: "One page per route, e.g. “Bangalore to Mysore”. Copy follows the direction rule: a route that STARTS in Karnataka, Andhra Pradesh, Telangana or Maharashtra gets a normal availability check; any other start is a request reviewed by our team.",
    build: ({ from, to }, label) => {
      const request = classifyOrigin(from) === "request";          // only the STARTING state decides
      const fromState = stateOfPlace(from);
      return make(label, "one-way", "Popular Routes", {
        icon: "route", eyebrow: request ? "Booking request" : "Outstation route", h1: `${from} to ${to} Cab${request ? " Request" : ""}`,
        lead: request
          ? `Request a cab from ${from} to ${to}. Our team reviews your request and confirms it — it is not a confirmed booking until you hear from us.`
          : `Book a cab from ${from} to ${to} — one-way or round trip, with the fare shown before you confirm.`,
        introHeading: request ? `Requesting a cab from ${from} to ${to}` : `Travelling from ${from} to ${to}`,
        body: request
          ? [`Trips that start outside Karnataka, Andhra Pradesh, Telangana and Maharashtra are handled as booking requests. Enter your route, submit the request, and our team will review it and confirm.`, `Your request is not a confirmed booking until you hear back from us. You can add stops along the way and tell us the vehicle that suits your group.`]
          : [`Enter your route in the form above to check availability and see the fare. Choose a one-way cab, or a round trip if you want the same driver for the return — and compare both, because a one-way fare is not simply half of a round trip.`, `${fromState ? `Trips that start in ${fromState} get a normal availability check, subject to the route, vehicle and date.` : "Availability depends on the route, vehicle and date."} You can add stops along the way and pick the vehicle that suits your group.`],
        bullets: request ? ["Submit a request for review", "Reviewed and confirmed by our team", "Add stops along the way", "Not confirmed until you hear from us"]
                         : ["One-way or round trip", "Add stops on the way", "Fare shown before you book", "Verified outstation drivers"],
        featuresHeading: `Why book ${from} to ${to} with us`, pricingHeading: "What affects your fare",
        pricing: ["One-way or round trip", "Vehicle category", "Travel date", "Tolls & parking at actuals"],
        routes: [{ from, to }],
        faqs: [
          faq(`Can I book a cab from ${from} to ${to}?`, request
            ? `Trips that start in ${from} are handled as a booking request. Submit your route and our team will review it and confirm — it is not a confirmed booking until you hear from us.`
            : "Yes — enter your route in the booking form to check availability and see the fare. Availability depends on the route, vehicle and date."),
          faq("Should I choose a one-way cab or a round trip?", "Compare both fares for your route and dates. A one-way cab ends at your drop point; a round trip keeps the same driver and car for the return."),
          faq("Can I add stops?", "Yes — use “Add stop” in the booking form and add all your stops before you search."),
          faq("How do I see the fare?", request ? "For a request, enter your pickup, drop and date and submit it; the team confirms the details with you." : "Enter your pickup, drop and date in the booking form — the fare is shown before you confirm."),
        ],
        ctaA: request ? "Need a cab" : "Heading to", ctaB: request ? `from ${from}?` : `${to}?`, ctaText: request ? "Submit your request and we'll get back to you." : "See your fare and book now.",
        seoTitle: request ? `${from} to ${to} Cab Request | Abhi Cabs` : ((`${from} to ${to} Cab | One-Way & Round Trip | Abhi Cabs`).length <= 60 ? `${from} to ${to} Cab | One-Way & Round Trip | Abhi Cabs` : `${from} to ${to} Cab | Abhi Cabs`),
        seoDesc: request
          ? `Request a cab from ${from} to ${to} with Abhi Cabs. Our team reviews your request and confirms it — it is not a confirmed booking until you hear from us.`
          : `Book a cab from ${from} to ${to} — one-way or round trip, with verified drivers and the fare shown before you confirm. Add stops along the way.`,
      });
    },
  },
  {
    id: "group-vehicle", label: "City — Group vehicle (Tempo Traveller, minibus)", input: "city", vehicle: true, group: "Tempo Traveller & Minibus Services", pattern: "{vehicle} in {city}",
    hint: "Group travel pages. These use an enquiry button (group quotes go through the contact form).",
    build: ({ city, vehicle }, label) => make(label, "", "Tempo Traveller & Minibus Services", {
      icon: "users", enquirySubject: "booking", eyebrow: "Group travel", h1: `${vehicle} in ${city}`,
      lead: `Hire a ${vehicle.toLowerCase()} in ${city} for family trips, tours, weddings and team outings — with a verified driver.`,
      introHeading: `Travel together, comfortably`,
      body: [`Group trips are easier in one vehicle. Tell us your date, route and group size, and our team will confirm availability and send you a quote.`, "We offer vehicles for small groups through to large coaches, so everyone travels together."],
      bullets: ["12 and 17 seater Tempo Travellers", "Coaches for larger groups", "Verified, experienced drivers", "A quote tailored to your trip"],
      featuresHeading: `Why hire a ${vehicle.toLowerCase()} with Abhi Cabs`, pricingHeading: "What affects a group-vehicle quote",
      pricing: ["Vehicle type and seating", "Route and number of days", "Travel dates", "Tolls, parking and driver allowance, as quoted"],
      howHeading: "How to get your quote",
      faqs: [
        faq(`How do I book a ${vehicle.toLowerCase()} in ${city}?`, "Send an enquiry with your travel date, route and group size. Our team confirms availability and shares the quote."),
        faq("What group sizes can you handle?", "From small groups in a Tempo Traveller up to larger groups in a coach — tell us your numbers and we'll suggest the right vehicle."),
        faq("Can I plan a multi-day trip?", "Yes — mention your itinerary in the enquiry and we'll quote accordingly."),
      ],
      ctaA: "Planning a", ctaB: "group trip?", ctaText: "Send us your details and we'll get back with a quote.",
      seoTitle: `${vehicle} in ${city} | Group Hire | Abhi Cabs`, seoDesc: `Hire a ${vehicle.toLowerCase()} in ${city} for family trips, tours, weddings and team outings. Verified drivers and a quote tailored to your trip.`,
    }),
  },
  {
    id: "corporate-city", label: "City — Corporate cabs", input: "city", group: "Corporate Transport", pattern: "Corporate Cabs in {city}",
    hint: "Business travel pages with an enquiry button.",
    build: ({ city }, label) => make(label, "", "Corporate Transport", {
      icon: "building", enquirySubject: "corporate", eyebrow: "Corporate", h1: `Corporate Cabs in ${city}`,
      lead: `Dependable transport for teams, client visits and events in ${city} — with GST invoicing and a dedicated point of contact.`,
      introHeading: "Travel your business can rely on",
      body: [`From employee commutes to client pickups and event logistics, corporate travel with Abhi Cabs means consistent, verified drivers and billing that works for finance teams.`, "Tell us your requirement and we'll set up the right arrangement for your organisation, whether you travel daily, weekly or only for events."],
      bullets: ["Employee & team transport", "Client & airport pickups", "GST invoicing & monthly billing", "Dedicated support contact"],
      featuresHeading: "Built for business travel", pricingHeading: "How corporate pricing works",
      pricing: ["Type of service and volume", "Vehicle category", "Billing cycle", "Tolls & parking at actuals"],
      faqs: [
        faq("Do you provide GST invoices?", "Yes. Corporate accounts get GST invoicing and monthly billing."),
        faq("How do I set up a corporate account?", "Send an enquiry with your requirement and our team will get in touch."),
        faq("Can you handle regular employee transport?", "Yes — share your timings and the number of people in the enquiry and we'll propose an arrangement that suits your team."),
      ],
      ctaA: "Let's set up", ctaB: "your account", ctaText: "Send an enquiry and we'll contact you.",
      seoTitle: `Corporate Cabs in ${city} | Business Travel | Abhi Cabs`, seoDesc: `Corporate cab services in ${city}: employee transport, client pickups and events with GST invoicing, verified drivers and a dedicated support contact.`,
    }),
  },
];

export const VEHICLE_SUGGESTIONS = ["Tempo Traveller", "Minibus", "Urbania", "Mini Bus on Rent", "Coach"];

/** Parse the modal's list box into template variables for a preset. */
export function parsePresetList(preset, text) {
  const items = text.split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
  if (preset.input === "state") {   // only the four operating states are valid
    return items.map((t) => OPERATING_STATES.find((st) => st.toLowerCase() === t.toLowerCase())).filter(Boolean).map((state) => ({ state }));
  }
  if (preset.input === "route") {
    return items.map((t) => { const m = t.split(/\s+(?:to|→|->|–|-)\s+/i); return m.length === 2 && m[0] && m[1] ? { from: m[0].trim(), to: m[1].trim() } : null; }).filter(Boolean);
  }
  return items.map((city) => ({ city }));
}

export const presetLabel = (preset, vars, vehicle) => {
  const v = { ...vars, vehicle };
  return preset.pattern.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "").replace(/\s+/g, " ").trim();
};
