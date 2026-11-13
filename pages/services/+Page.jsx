import React from "react";
import {
  Plane, Navigation, Car, Repeat, Timer, MapPin, Users, UserCheck,
  ShieldCheck, Headset, Route, Truck, CalendarCheck, Sparkles, Info,
  ChevronRight,
} from "lucide-react";
import SectionHead from "../../src/components/ui/SectionHead";
import Card from "../../src/components/ui/Card";
import Reveal from "../../src/components/ui/Reveal";
import CTASection from "../../src/components/CTASection";


const GOLD = "#E6AC00";

/* ── Service Cards ── */
const SERVICE_CARDS = [
  {
    Icon: Plane,
    title: "Airport Taxi Services – Convenient Airport Transfers",
    desc: "Book airport taxi services with Abhi Cabs 24×7 for airport pickups and drop-offs. Whether you're travelling for business or leisure, choose a suitable cab for your airport journey and enjoy comfortable transportation with professional drivers.",
    cta: "Book Airport Taxi",
  },
  {
    Icon: Navigation,
    title: "Outstation Cab Services – Comfortable Long-Distance Travel",
    desc: "Planning a family vacation, business trip, or weekend getaway? Abhi Cabs 24×7 outstation cab services offer convenient intercity and interstate taxi bookings from supported pickup locations to destinations across India.",
    cta: "Book Outstation Cab",
  },
  {
    Icon: MapPin,
    title: "One-Way Cab Services – Convenient Point-to-Point Travel",
    desc: "Need a cab to another city without a return journey? Choose one-way cab booking with Abhi Cabs 24×7 for business travel, family visits, and intercity trips. Book a comfortable taxi based on your route and travel requirements.",
    cta: "Book One-Way Cab",
  },
  {
    Icon: Repeat,
    title: "Round-Trip Cab Services – Flexible Return Journeys",
    desc: "Plan your return journey with Abhi Cabs 24×7 round-trip taxi services. Ideal for family holidays, sightseeing, pilgrimages, and business trips, our round-trip cab bookings help you travel according to your schedule.",
    cta: "Book Round-Trip Cab",
  },
  {
    Icon: Timer,
    title: "Hourly Cab Rentals – Travel on Your Schedule",
    desc: "Need a taxi for a few hours? Choose hourly cab rental services from Abhi Cabs 24×7 for shopping, meetings, sightseeing, and personal travel. Select an hourly rental package suited to your journey.",
    cta: "Book Hourly Rental",
  },
  {
    Icon: Car,
    title: "Local Taxi Services – Easy City Transportation",
    desc: "Book local taxi services with Abhi Cabs 24×7 for city sightseeing, business meetings, shopping, and everyday travel. Choose a convenient local cab for short journeys within supported cities.",
    cta: "Book Local Cab",
  },
  {
    Icon: Users,
    title: "Group Transportation – Travel Together Comfortably",
    desc: "Planning a wedding, corporate outing, family tour, or group vacation? Abhi Cabs 24×7 group transportation services offer Tempo Travellers, Force Urbania vehicles, and buses for group travel, based on passenger count and availability.",
    cta: "Book Group Vehicle",
  },
  {
    Icon: UserCheck,
    title: "Driver Services – Professional Driving Assistance",
    desc: "Need a driver for your journey? Abhi Cabs 24×7 driver services provide professional driving assistance for personal travel, business trips, and other transportation needs in supported locations.",
    cta: "Enquire About Driver Services",
  },
];

/* ── Travel Occasions ── */
const OCCASIONS = [
  { label: "Family Vacations", desc: "Outstation and round-trip cabs for holidays and sightseeing." },
  { label: "Business Travel", desc: "Airport transfers, local trips, and intercity taxi bookings." },
  { label: "Corporate Transportation", desc: "Group vehicles for meetings, events, and team outings." },
  { label: "Pilgrimage Tours", desc: "Convenient cab bookings for religious journeys." },
  { label: "Weddings & Events", desc: "Vehicle rentals for guests and group transportation." },
  { label: "City Sightseeing", desc: "Local taxis and hourly cab rentals for exploring destinations." },
];

/* ── Popular Routes ── */
const ROUTES = [
  { label: "Bangalore to Mysore Cabs", desc: "Convenient taxi booking for business, sightseeing, and family trips." },
  { label: "Bangalore to Hyderabad Cabs", desc: "Comfortable interstate cab services for long-distance travel." },
  { label: "Hyderabad to Vijayawada Cabs", desc: "Outstation taxi booking for personal and business journeys." },
  { label: "Pune to Mumbai Cabs", desc: "Convenient intercity travel and airport connections." },
  { label: "Hyderabad to Bangalore Cabs", desc: "Flexible one-way and round-trip taxi options." },
];

/* ── Booking Info ── */
const BOOKING_INFO = [
  { label: "Pickup & Drop Location", desc: "Enter your travel starting point and destination." },
  { label: "Travel Date & Time", desc: "Select your preferred pickup schedule." },
  { label: "Trip Type", desc: "Choose one-way, round-trip, hourly rental, or another available service." },
  { label: "Passengers & Luggage", desc: "Select a vehicle suited to your group size and luggage." },
  { label: "Rental Duration", desc: "Check the applicable hours or trip duration." },
  { label: "Additional Charges", desc: "Confirm applicable tolls, parking fees, permits, and other charges before booking." },
];

/* ── How to Book Steps ── */
const STEPS = [
  { title: "Step 1 – Enter Your Travel Details", desc: "Select your pickup location, destination, travel date, and preferred cab service." },
  { title: "Step 2 – Choose Your Preferred Vehicle", desc: "Explore available cabs and select a vehicle based on your passenger count, luggage, and travel needs." },
  { title: "Step 3 – Submit Your Booking Request", desc: "Enter the required details and follow the booking instructions to arrange your journey." },
];

/* ── FAQs ── */
const FAQS = [
  { q: "1. What types of cab services does Abhi Cabs 24×7 provide?", a: "Abhi Cabs 24×7 offers airport taxi services, local cabs, outstation taxi bookings, one-way trips, round-trip cabs, hourly rentals, driver services, and group transportation." },
  { q: "2. Can I book an outstation cab to destinations across India?", a: "Yes. We provide outstation cab bookings with pickups from Karnataka, Andhra Pradesh, Maharashtra, and Telangana to destinations across India, subject to route availability." },
  { q: "3. Does Abhi Cabs 24×7 provide one-way taxi services?", a: "Yes. You can book one-way cabs for intercity travel, business trips, and point-to-point journeys without scheduling a return trip." },
  { q: "4. Are hourly cab rental services available?", a: "Yes. Abhi Cabs 24×7 offers hourly cab rentals for shopping, local sightseeing, business meetings, and personal travel." },
  { q: "5. Can I book a round-trip taxi for a family vacation?", a: "Yes. Our round-trip cab services are suitable for family holidays, sightseeing, pilgrimages, and long-distance travel." },
  { q: "6. Do you provide airport pickup and drop-off services?", a: "Yes. We provide airport taxi booking services from supported pickup and drop-off locations, with different vehicle options based on passenger and luggage requirements." },
  { q: "7. Can I book a Tempo Traveller or bus for group travel?", a: "Yes. Abhi Cabs 24×7 provides Tempo Travellers, Force Urbania vehicles, and buses for family tours, weddings, corporate outings, and group transportation." },
  { q: "8. Are professional drivers available with cab bookings?", a: "Yes. Our chauffeur-driven cab services include professional drivers for your travel requirements." },
  { q: "9. Can I book a cab in advance?", a: "Yes. You can request a cab booking for your preferred travel date and pickup time, subject to vehicle availability." },
  { q: "10. How can I book a cab online with Abhi Cabs 24×7?", a: "Visit abhicabs24x7.com, select your cab service, enter your pickup and destination details, choose an available vehicle, and follow the booking process." },
];

export default function Page() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="/images/tea-garden-road.jpg" alt="Cab booking services across India" fetchPriority="high" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(17,17,17,0.92) 0%, rgba(17,17,17,0.66) 48%, rgba(17,17,17,0.35) 100%)" }} />
        </div>
        <div style={{ position: "relative", maxWidth: 1264, margin: "0 auto", padding: "clamp(56px,7vw,92px) 24px" }}>
          <Reveal as="h1" className="ac-hero-fade-up" style={{ fontSize: "clamp(28px,4.2vw,46px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, maxWidth: 1200 }}>
            Cab Booking Services – <span className="ac-h1-highlight">Airport, Local & Outstation Cabs</span> Across India
          </Reveal>

        </div>
      </section>

      {/* ═══ TRAVEL YOUR WAY ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight">Travel Your Way with Abhi Cabs 24×7</h2>
            <p className="mt-5 text-text-secondary text-[15.5px] leading-relaxed max-w-[800px]">
              Looking for reliable <span className="ac-hl">cab booking services across India</span>? Abhi Cabs 24×7 offers airport transfers, local taxi services, outstation cab bookings, one-way cabs, round-trip taxis, hourly car rentals, driver services, and group transportation. With pickups from <span className="ac-hl">Karnataka, Andhra Pradesh, Maharashtra, and Telangana</span> to destinations across India, we make every journey comfortable and convenient.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ EXPLORE OUR CAB BOOKING SERVICES ═══ */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-11" title="Explore Our Cab Booking Services" />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICE_CARDS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <Card className="p-6 h-full ac-card-hover">
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <s.Icon size={21} style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-[17px] font-bold">{s.title}</h3>
                  <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{s.desc}</p>
                  <a href="#booking" className="inline-block mt-4 text-[14px] font-bold" style={{ color: GOLD }}>{s.cta} →</a>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CAB SERVICES FOR EVERY TRAVEL OCCASION ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight text-center">Cab Services for Every Travel Occasion</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2 text-center">Flexible Travel Solutions for Personal & Business Needs</h3>
            <p className="mt-4 text-text-secondary text-[15px] leading-relaxed text-center max-w-[700px] mx-auto">
              At Abhi Cabs 24×7, we provide cab rental solutions for different travel requirements.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {OCCASIONS.map((o, i) => (
              <Reveal key={o.label} delay={i * 0.06}>
                <Card className="p-6 h-full ac-card-hover">
                  <h4 className="text-[15.5px] font-bold">{o.label}</h4>
                  <p className="text-[13.5px] text-text-secondary mt-1.5 leading-relaxed">{o.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POPULAR OUTSTATION CAB ROUTES ═══ */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight text-center">Popular Outstation Cab Routes</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2 text-center">Explore Intercity Taxi Services with Abhi Cabs 24×7</h3>
            <p className="mt-4 text-text-secondary text-[15px] leading-relaxed text-center max-w-[700px] mx-auto">
              Planning an intercity journey? Explore popular <span className="ac-hl">outstation cab routes</span> from our supported pickup states.
            </p>
          </Reveal>
          <div className="max-w-[800px] mx-auto mt-8 space-y-4">
            {ROUTES.map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <ChevronRight size={18} className="text-[#E6AC00] mt-0.5 shrink-0" />
                <p className="text-[15px]"><span className="font-bold">{r.label}:</span> <span className="text-text-secondary">{r.desc}</span></p>
              </div>
            ))}
            <p className="text-[15px] text-text-secondary mt-4">Explore available routes and book your preferred cab with Abhi Cabs 24×7.</p>
          </div>
        </div>
      </section>

      {/* ═══ CAB BOOKING FROM 4 STATES ═══ */}
      <section className="py-14 md:py-20" style={{ background: "linear-gradient(135deg,#1C1C1C,#0a0a0a)" }}>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
              Cab Booking from Karnataka, Andhra Pradesh, Maharashtra & Telangana
            </h2>
            <h3 style={{ fontSize: "clamp(15px,1.5vw,18px)", fontWeight: 600, color: "#FFD54F", marginTop: 10, textAlign: "center" }}>
              Travel from Supported Pickup Locations to Destinations Across India
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 740, margin: "16px auto 0", textAlign: "center" }}>
              Abhi Cabs 24×7 provides <span className="ac-mark-d">interstate cab booking services</span> with pickups from <span className="ac-mark-d">Karnataka, Andhra Pradesh, Maharashtra, and Telangana</span> to destinations across India. Whether you need an airport transfer, local taxi, hourly rental, or outstation cab, choose a travel service that matches your requirements.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ IMPORTANT INFORMATION BEFORE BOOKING ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight text-center">Important Information Before Booking Your Cab</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2 text-center">Plan Your Journey with Confidence</h3>
            <p className="mt-4 text-text-secondary text-[15px] leading-relaxed text-center max-w-[700px] mx-auto">
              Before booking your ride with <span className="ac-hl">Abhi Cabs 24×7</span>, consider the following details:
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 max-w-[960px] mx-auto">
            {BOOKING_INFO.map((b, i) => (
              <Reveal key={b.label} delay={i * 0.06}>
                <Card className="p-5 h-full">
                  <h4 className="text-[15px] font-bold">{b.label}</h4>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{b.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW TO BOOK ═══ */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[860px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight text-center">How to Book a Cab with Abhi Cabs 24×7</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2 text-center">Book Your Journey in Three Simple Steps</h3>
          </Reveal>
          <div className="mt-10 space-y-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="flex items-start gap-5">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#111", color: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <h4 className="text-[16px] font-bold">{s.title}</h4>
                    <p className="text-[14px] text-text-secondary mt-1.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQs ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[860px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-9" title="Frequently Asked Questions About Our Cab Services" />
          </Reveal>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group bg-[#FAFAFA] border border-border rounded-[16px] p-5 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between text-[15px] font-bold list-none">
                  {q}
                  <span className="text-[color:var(--color-primary-dark)] text-[20px] leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-[14px] text-text-secondary mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CTASection
        id="services-cta"
        onBookMode={() => { if (typeof window !== "undefined") window.location.href = "#booking"; }}
        line1="Ready to Book Your Next Ride"
        line2="with Abhi Cabs 24×7?"
        description="Choose Your Journey. Find Your Cab. Start Travelling. Whether you're planning an airport transfer, local journey, outstation trip, hourly rental, or group tour, Abhi Cabs 24×7 offers flexible cab booking options for your travel needs. Enter your travel details, explore available vehicles, and plan your next journey with ease."
        primaryLabel="Check Available Cabs"
        secondary={false}
      />
    </>
  );
}
