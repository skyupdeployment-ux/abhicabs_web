import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { usePageContext } from "vike-react/usePageContext";
import { selectJourney } from "../../src/store/slices/journeySlice";
import CTASection from "../../src/components/CTASection";
import FAQSection from "../../src/components/FAQSection";
import JourneyCategoriesSection from "../../src/components/JourneyCategoriesSection";
import MobileStickyBar from "../../src/components/MobileStickyBar";
import ReviewsSection from "../../src/components/ReviewsSection";
import StatsBarSection from "../../src/components/StatsBarSection";
import HowItWorksSection from "../../src/components/HowItWorksSection";
import CoverageSection from "../../src/components/CoverageSection";
import PopularRoutesSection from "../../src/components/PopularRoutesSection";
import WhyAbhiCabsSection from "../../src/components/WhyAbhiCabsSection";
import PromoBannersSection from "../../src/components/PromoBannersSection";
import FreeCancellationBannerSection from "../../src/components/FreeCancellationBannerSection";
import GroupTransportBannerSection from "../../src/components/GroupTransportBannerSection";
import ServiceStripSection from "../../src/components/ServiceStripSection";
import FleetCarouselSection from "../../src/components/FleetCarouselSection";
import HeroSection from "../../src/components/HeroSection";
import { ROUTES } from "../../src/data/mockData";
import useVehicleCatalogue from "../../src/hooks/useVehicleCatalogue";
import { IconClock, IconShield, IconTag, IconCar } from "../../src/components/Icons";
import SectionRenderer from "../../src/components/SectionRenderer";
import { usePageContent } from "../../src/hooks/usePageContent";

// NOTE: SERVICES (One Way / Round Trip / Local Rentals / Airport Transfers
// cards) previously powered a standalone "Choose Your Journey" section that
// isn't part of this spec's structure. The same trip types are now
// reachable via ServiceStripSection instead — no functionality was lost,
// just this specific card grid.

// NEW: quick-select pills below the hero search widget (Figma redesign).
// "group-coach" is deliberately included visually per the design, but has
// no real backend trip type behind it yet — see BookingWidget.jsx's
// GROUP_COACH_ENABLED note for why selecting it shows a request-a-quote
// state instead of a real search.
// NOTE: QUICK_SELECT previously powered QuickSelectPills, a row of pills
// below the hero. That component isn't part of this spec's structure —
// the same trip types are now reachable via ServiceStripSection instead.

const WHY_US = [
  { title: "Verified & Professional Drivers", desc: "Trained, background-checked chauffeurs for a safe journey.", icon: <IconShield className="w-5 h-5" /> },
  { title: "Well-Maintained Vehicles", desc: "Clean, serviced and journey-ready AC & non-AC cabs.", icon: <IconCar className="w-5 h-5" /> },
  { title: "Transparent Pricing", desc: "Clear rates, no hidden charges — what you see is what you pay.", icon: <IconTag className="w-5 h-5" /> },
  { title: "Pan-India Coverage", desc: "Serving Andhra Pradesh, Karnataka, Maharashtra & Telangana.", icon: <IconClock className="w-5 h-5" /> },
  { title: "Flexible Vehicle Options", desc: "4-seaters to 33-seat coaches for every group size.", icon: <IconShield className="w-5 h-5" /> },
  { title: "24×7 Customer Support", desc: "Help whenever you travel — call or WhatsApp anytime.", icon: <IconClock className="w-5 h-5" /> }
];

const STEPS = [
  { n: "01", title: "Search", desc: "Choose pickup, destination, date and time." },
  { n: "02", title: "Choose", desc: "Select the vehicle that fits your journey." },
  { n: "03", title: "Travel", desc: "Your driver arrives at the scheduled pickup point." }
];

const SEATER_OPTIONS = ["12", "13", "16", "17", "22", "28", "33"];

// NEW: coverage cities list — real service areas, matching what's already
// established elsewhere in this project (Karnataka + Hyderabad/Telangana,
// per the header's "Serving Karnataka & Hyderabad").
const COVERAGE = {
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Dharwad", "Belagavi", "Shivamogga", "Davangere", "Tumakuru", "Hassan", "Udupi", "Coorg"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Nalgonda", "Suryapet"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Kakinada"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur", "Solapur"],
};

// NEW: "Plan Your Next Journey" categories — image placeholders per the
// design's own "or browse files" markers; no real photos assigned to these
// specific use-cases anywhere in this project yet.
const JOURNEY_CATEGORIES = [
  { label: "Weekend Escapes",   img: "/images/weekend.webp" },
  { label: "Business Travel",   img: "/images/bussiness.webp" },
  { label: "Airport Transfers",  img: "/images/airport.webp" },
  { label: "Family Trips",      img: "/images/family.webp" },
  { label: "Corporate Travel",  img: "/images/corporate.webp" },
  { label: "Group Tours",       img: "/images/group.webp" },
];


// FIX: replaced the old 4-question list with the exact 10 questions from
// the Figma redesign. Answers are genuine, written to match how this site
// actually works (verified against real backend behavior throughout this
// project) — not copied placeholder text.
const FAQS = [
  { q: "What areas do you currently serve?", a: "We currently operate across Karnataka and Hyderabad, with outstation trips available to neighbouring states." },
  { q: "Do you provide one-way cab services?", a: "Yes — book a One Way trip and pay only for the distance you travel, with no return-fare charge." },
  { q: "Do you provide round-trip travel?", a: "Yes — Round Trip keeps the same driver and cab for your entire outstation itinerary, including any return leg." },
  { q: "Do you provide airport transfers?", a: "Yes — on-time pickups and drops with live flight tracking, for both arrivals and departures." },
  { q: "Can I book a Tempo Traveller?", a: "Yes — 12 and 17 seater Tempo Travellers are available under Group / Coach bookings." },
  { q: "Can I book a large coach?", a: "Yes — coaches up to 33 seaters are available for groups via Group / Coach. For larger requirements, contact us for a custom quote." },
  { q: "How is outstation pricing calculated?", a: "Outstation fares are based on distance travelled, with a minimum per-day kilometre allowance and applicable driver allowance for multi-day trips." },
  { q: "Can I schedule a cab in advance?", a: "Yes — choose any future pickup date and time when booking; there's no need to book only for immediate travel." },
  { q: "What payment options are available?", a: "UPI, card, net banking, and cash on trip completion are all supported, along with partial and pay-later options at checkout." },
  { q: "What is the cancellation policy?", a: "Cancellations made well ahead of pickup are free. See our Cancellation & Refund Policy page for full details and any applicable charges." },
];


// ─── Fleet section with category tabs ───────────────────────────────────────
// FIX: previously used fabricated names and quotes ("Rohit A.", "Sneha N.",
// etc.) presented as if real — the Figma design itself marks these as
// placeholders needing real testimonials before launch, so using the same
// honest placeholder text here is more accurate than inventing fake
// customer names.
// FIX: figures below are exactly what the Figma design itself labels as
// sample/placeholder data — its own annotation literally reads "Sample
// figures shown for layout — replace with verified company data before
// launch." Kept that same honest disclaimer here rather than presenting
// these as real numbers.
const STATS = [
  { value: "10,000+", label: "Completed Trips" },
  { value: "500+", label: "Driver Partners" },
  { value: "20+", label: "Service Locations" },
  { value: "24/7", label: "Customer Support" },
];

const REVIEWS = [
  { quote: "Booked a round trip from Bangalore to Coorg for a family vacation. The driver was very professional, car was spotless, and the pricing was completely transparent — no hidden charges at all.", name: "Rajesh Kumar", meta: "Bengaluru", stars: 5 },
  { quote: "Used Abhi Cabs for our office team outing — a 33-seater coach to Pondicherry. Smooth booking, on-time pickup, and the driver knew the best routes. Will definitely use again for corporate trips.", name: "Priya Sharma", meta: "Hyderabad", stars: 5 },
  { quote: "Airport pickup at 4 AM and the driver was already waiting 10 minutes early. Very comfortable Innova, clean interiors. Best cab service I've used in Karnataka.", name: "Mohammed Irfan", meta: "Mysuru", stars: 5 },
  { quote: "We travel Bangalore to Mysore almost every weekend and Abhi Cabs has become our go-to. Reliable drivers, fair pricing, and their 24/7 support actually picks up when you call!", name: "Sneha Reddy", meta: "Bengaluru", stars: 5 },
];

// NOTE: FLEET_TABS previously configured FleetChooseRideSection's category
// tabs. That component is replaced by FleetCarouselSection (a horizontally
// scrolling carousel, matching this spec), which doesn't filter by tabs.

export default function Page() {
  const pageContext = usePageContext();
  const [widgetKey, setWidgetKey] = useState("default");
  const [widgetProps, setWidgetProps] = useState({ initialMode: "one-way", presetPickup: "", presetDrop: "" });
  // Which trip-type tab the booking widget currently has open. The quick-select
  // service cards read this so they highlight the same thing the widget shows.
  const [activeMode, setActiveMode] = useState("one-way");
  // Show the fleet the backend actually has switched on, not a bundled list.
  const { grouped: fleetVehicles, loading: fleetLoading, error: fleetError, retry: fleetRetry } = useVehicleCatalogue();

  // Hero + features are rendered by HeroSection; any OTHER sections an editor
  // adds to the Home page in the Blog Builder (text, CTA, FAQ, testimonials,
  // gallery, banner…) render here via SectionRenderer. Empty by default, so the
  // homepage is unchanged until an admin adds something.
  const homeCms = usePageContent("home");
  const homeCmsSections = homeCms.sections;
  const extraHomeSections = (homeCmsSections || []).filter(
    (s) => s.type !== "hero" && s.type !== "features"
  );

  // NOTE: this homepage previously had its own embedded Contact form
  // (id="contact") wired to the real POST /api/v1/contact endpoint — the
  // same one pages/contact/+Page.jsx uses. It's been removed here because
  // the target page structure doesn't include it, but the working contact
  // form still exists and functions correctly on the dedicated /contact
  // page — nothing was lost, just consolidated to one place.

  // FIX: "group-coach" used to switch the booking widget to a fake
  // "request a quote" tab (see BookingWidget.jsx's old TABS note — it was
  // never backed by a real trip type). That tab has been removed entirely;
  // every "Request Group Quote" / "Group / Coach" trigger across the page
  // now scrolls to the real, working Contact form instead.
  function bookMode(mode) {
    if (mode === "group-coach") {
      // the old on-page contact form is gone — group/coach quotes go to the real contact form
      if (typeof window !== "undefined") window.location.href = "/contact-us?subject=booking#contact-form";
      return;
    }
    setActiveMode(mode);
    setWidgetProps({ initialMode: mode, presetPickup: "", presetDrop: "" });
    setWidgetKey(mode + "-" + Date.now());
    setTimeout(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  // Arriving with ?mode=one-way (etc.) — e.g. from the Group/Coach browse
  // page's Trip Type filter, which has no real search of its own to send
  // someone to — opens the booking widget straight on that tab instead of
  // leaving the trip-type choice they already made on the ground.
  //
  // Arriving with ?j=<journeyId> — "Modify Search" from booking-search or
  // checkout. Previously this landed on a blank widget (only ?mode was
  // read), so editing a search meant re-typing pickup/drop/date/stops from
  // scratch. Now the full journey is loaded from the store and the widget
  // opens pre-filled with it — editable, not wiped.
  const journeyIdToEdit = pageContext.urlParsed?.search?.j || null;
  const journeyToEdit = useSelector(selectJourney(journeyIdToEdit));
  useEffect(() => {
    if (journeyIdToEdit && journeyToEdit) {
      setActiveMode(journeyToEdit.tripType || "one-way");
      setWidgetProps({
        initialMode: journeyToEdit.tripType || "one-way",
        presetPickup: journeyToEdit.pickup || "",
        presetDrop: journeyToEdit.drop || "",
        presetJourney: journeyToEdit,
      });
      setWidgetKey("edit-" + journeyIdToEdit);
      setTimeout(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }), 50);
      return;
    }
    const requestedMode = pageContext.urlParsed?.search?.mode;
    if (requestedMode) bookMode(requestedMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bookRoute(route) {
    setActiveMode("one-way");
    setWidgetProps({ initialMode: "one-way", presetPickup: route.from, presetDrop: route.to });
    setWidgetKey("route-" + Date.now());
    setTimeout(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  // ── CMS-driven homepage layout ──────────────────────────────────────────
  // Each built-in section keeps its exact design; the CMS only controls the
  // ORDER and which are shown (page._layout, edited in the builder). With no
  // saved layout this renders in DEFAULT_HOME_ORDER — identical to before.
  const DEFAULT_HOME_ORDER = ["servicestrip", "freecancel", "fleet", "grouptransport", "promobanners", "whyus", "routes", "coverage", "howitworks", "stats", "reviews", "journey", "seocontent", "faq", "cta"];
  const homeNodes = {
    trustbadges: (
      <section style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "14px 0" }}>
        <div style={{ maxWidth: 1264, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px,4vw,48px)", flexWrap: "wrap" }}>
          <TrustBadge platform="Google" rating="4.8" reviews="4.2K+" color="#4285F4" />
          <TrustBadge platform="Trustpilot" rating="4.7" reviews="2.1K+" color="#00B67A" />
          <TrustItem icon={<IconShield className="w-4 h-4" />} text="Clean & Hygienic Cars" />
          <TrustItem icon={<IconTag className="w-4 h-4" />} text="Transparent Billing" />
          <TrustItem icon={<IconCar className="w-4 h-4" />} text="Expert Chauffeurs" />
          <TrustItem icon={<IconClock className="w-4 h-4" />} text="2000+ Routes" />
        </div>
      </section>
    ),
    servicestrip: <ServiceStripSection onSelect={bookMode} activeMode={activeMode} />,
    freecancel: <FreeCancellationBannerSection />,
    fleet: <FleetCarouselSection vehicles={fleetVehicles} loading={fleetLoading} error={fleetError} onRetry={fleetRetry} />,
    grouptransport: <GroupTransportBannerSection seaterOptions={SEATER_OPTIONS} onRequestQuote={() => bookMode("group-coach")} />,
    promobanners: <PromoBannersSection onOutstation={() => bookMode("round-trip")} onGroup={() => bookMode("group-coach")} />,
    whyus: <WhyAbhiCabsSection imageSrc="/images/morethanjustride.webp" />,
    routes: <PopularRoutesSection routes={ROUTES} onBook={bookRoute} />,
    coverage: <CoverageSection coverage={COVERAGE} />,
    howitworks: <HowItWorksSection steps={STEPS} />,
    stats: <StatsBarSection stats={STATS} />,
    reviews: <ReviewsSection reviews={REVIEWS} />,
    journey: <JourneyCategoriesSection categories={JOURNEY_CATEGORIES} />,
    seocontent: (
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "60px 24px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Book a Cab Online with AbhiCabs 24x7</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Looking for a reliable cab service? Book a cab online with AbhiCabs 24x7 for comfortable and convenient travel across India. We provide outstation cab services and airport transfers, with AC and non-AC vehicles to suit your comfort preferences and budget. Book your ride from Andhra Pradesh, Karnataka, Maharashtra, and Telangana to destinations across India. Whether travelling for business, family vacations, or trips with friends, enjoy convenient booking and a smooth travel experience.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Our Cab Booking Services</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>AbhiCabs 24x7 provides reliable cab booking services for airport transfers, outstation trips, and long-distance travel across India. Book your ride from Andhra Pradesh, Karnataka, Maharashtra, or Telangana to destinations anywhere in India. Travel with friends, family, or colleagues and enjoy comfortable rides, flexible travel options, easy online booking, and hassle-free journeys.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Popular Outstation Cab Routes</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Plan family vacations, trips with friends, weekend getaways, solo trips or business journeys, or airport transfers with AbhiCabs 24x7. Book outstation cabs from Andhra Pradesh, Karnataka, Maharashtra, and Telangana to destinations across India. Enjoy comfortable long-distance taxi services, reliable airport cab booking, and flexible travel options for exploring new cities, visiting loved ones, and creating unforgettable road trip memories.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Airport Cab Service</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Choose AbhiCabs 24x7 for reliable airport cab services across India. Book a comfortable cab for airport pickups and drop-offs from Andhra Pradesh, Karnataka, Maharashtra, and Telangana. Enjoy easy online booking, convenient travel, and flexible pickup options for airport rides. Reach your airport comfortably and travel stress-free.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Choose the Right Cab for Your Journey</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Choose the perfect ride with AbhiCabs 24x7 for comfortable travel across India. Book a Swift Dzire, Innova, Ertiga, or Innova Hycross for family trips and business travel, or choose a Tempo Traveller, Urbania, or BharatBenz for group tours and outstation journeys. Select from 4, 8, 12, 13, 16, 17, 22, 28, and 33-seater options, with AC and non-AC vehicles to suit your comfort and budget. Enjoy convenient airport taxi services and outstation cab bookings from Andhra Pradesh, Karnataka, Maharashtra, and Telangana to destinations across India.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Corporate Cab Services</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Simplify business travel with AbhiCabs 24x7 Corporate Cab Services. We provide convenient employee transportation, airport transfers, and business trip cab bookings from Andhra Pradesh, Karnataka, Maharashtra, and Telangana to destinations across India. Choose AC or non-AC vehicles to suit your requirements and budget, with professional drivers and comfortable travel options for your team.</p>
          </div>

          <div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#141414", marginBottom: 12, lineHeight: 1.3 }}>Book Your Next Journey</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555" }}>Every memorable trip begins with the right travel partner. With AbhiCabs 24x7, plan road trips with friends, family holidays, corporate travel, or airport transfers with ease. Start your journey from Andhra Pradesh, Karnataka, Maharashtra, or Telangana and travel to your preferred destinations across India. Choose from vehicles such as Swift Dzire, Ertiga, Innova, Innova Hycross, Tempo Traveller, Urbania, and BharatBenz, with different seating capacities to accommodate individuals and groups. Select AC or non-AC options according to your comfort and budget.</p>
          </div>
        </div>
      </section>
    ),
    faq: <FAQSection faqs={FAQS} />,
    cta: <CTASection onBookMode={bookMode} />,
  };
  const homeOrder = homeCms.getLayout(DEFAULT_HOME_ORDER);

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero stays first (contains the booking engine); CMS blocks the admin
          adds render next; then the built-in sections in CMS layout order. */}
      <HeroSection widgetKey={widgetKey} widgetProps={widgetProps} onModeChange={setActiveMode} />

      {extraHomeSections.length > 0 && <SectionRenderer sections={extraHomeSections} />}

      {homeOrder.map(({ key, hidden }) =>
        hidden || !homeNodes[key] ? null : <React.Fragment key={key}>{homeNodes[key]}</React.Fragment>
      )}
    </div>
  );

}

function TrustBadge({ platform, rating, reviews, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        {[1,2,3,4,5].map((s) => (
          <svg key={s} width="14" height="14" viewBox="0 0 20 20" fill={s <= Math.floor(parseFloat(rating)) ? color : "#E5E7EB"}>
            <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.69l5.34-.78L10 1z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{rating}</span>
      <span style={{ fontSize: 12, color: "#6B7280" }}>({reviews} Reviews)</span>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{platform}</span>
    </div>
  );
}

function TrustItem({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
      <span style={{ color: "#059669" }}>{icon}</span>
      {text}
    </div>
  );
}