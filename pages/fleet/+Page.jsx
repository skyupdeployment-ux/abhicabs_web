import React, { useState } from "react";
import { fmtINR } from "../../src/data/mockData";
import usePageContent from "../../src/hooks/usePageContent";
import useVehicleCatalogue from "../../src/hooks/useVehicleCatalogue";
import Button from "../../src/components/ui/Button";
import Reveal from "../../src/components/ui/Reveal";
import SectionHead from "../../src/components/ui/SectionHead";
import FuelToggle from "../../src/components/FuelToggle";
import Card from "../../src/components/ui/Card";
import { IconSeat, IconLuggage, IconAC, IconCar, IconBus, IconTruck, IconCheck, IconClose, IconStar, IconChevronRight } from "../../src/components/Icons";
import CTASection from "../../src/components/CTASection";

const GOLD = "#E6AC00";

const TABS = [
  { id: "all",    label: "All",           icon: "all" },
  { id: "sedan",  label: "Sedan",         icon: "sedan" },
  { id: "suv",    label: "SUV",           icon: "suv" },
  { id: "luxury", label: "Luxury",        icon: "luxury" },
  { id: "tempo",  label: "Tempo / Coach", icon: "tempo" },
  { id: "bus",    label: "Bus",           icon: "bus" },
];

/* ── Fleet Category Descriptions (from spec) ── */
const CATEGORY_INFO = {
  sedan:  { title: "Sedan Cabs – Comfortable & Budget-Friendly Travel",         desc: "Book a Swift Dzire or similar sedan with Abhi Cabs 24×7 for airport transfers, local travel, business meetings, and outstation trips. A convenient choice for individuals and small families." },
  suv:    { title: "SUV & MUV Cabs – Spacious Family Travel",                   desc: "Choose Ertiga, Innova, or Innova Hycross from Abhi Cabs 24×7 for family vacations, long-distance journeys, and round-trip cab bookings. Enjoy spacious seating and comfortable travel." },
  tempo:  { title: "Tempo Traveller Rentals – Ideal for Group Trips",           desc: "Planning a family tour, pilgrimage, or corporate outing? Abhi Cabs 24×7 Tempo Traveller rentals provide convenient group transportation for sightseeing, outstation trips, and special occasions." },
  luxury: { title: "Force Urbania Rentals – Premium Group Transportation",      desc: "Travel comfortably with Force Urbania rental services from Abhi Cabs 24×7. A suitable choice for corporate travel, family tours, and long-distance group journeys." },
  bus:    { title: "Bus & Coach Rentals – Travel Together",                     desc: "Choose BharatBenz buses and coaches from Abhi Cabs 24×7 for weddings, corporate events, school and college trips, and large group tours." },
};

/* ── Cab Rental Options ── */
const RENTAL_OPTIONS = [
  { label: "Airport Taxi Booking", desc: "Convenient airport pickup and drop-off services." },
  { label: "Outstation Cab Rentals", desc: "Comfortable intercity and interstate journeys." },
  { label: "Round-Trip Cab Booking", desc: "Flexible return journeys for business and family trips." },
  { label: "Hourly Cab Rentals", desc: "Book cabs for meetings, shopping, sightseeing, and local travel." },
  { label: "Local Taxi Services", desc: "Convenient vehicle options for everyday city travel." },
  { label: "Group Vehicle Rentals", desc: "Tempo Travellers, Urbania, and buses for group transportation." },
];

/* ── Why Choose Fleet ── */
const WHY_CHOOSE = [
  { title: "Wide Range of Vehicles", desc: "Choose from sedans, SUVs, Innova, Tempo Travellers, Urbania, and buses." },
  { title: "Flexible Seating Options", desc: "Vehicles ranging from 4-seaters to 50-seaters for individuals, families, and groups." },
  { title: "Comfortable Travel Options", desc: "Select spacious vehicles suited to short city rides or long-distance journeys." },
  { title: "AC & Non-AC Vehicles", desc: "Choose available vehicle options based on your travel preferences." },
  { title: "Vehicles for Every Occasion", desc: "Suitable for airport transfers, family vacations, corporate outings, weddings, and group tours." },
  { title: "Flexible Rental Packages", desc: "Choose hourly cab rentals, local travel, outstation trips, or round-trip bookings." },
  { title: "Easy Vehicle Selection", desc: "Explore the Abhi Cabs 24×7 fleet and choose a vehicle that matches your group size and travel plans." },
];

/* ── FAQs ── */
const FLEET_FAQS = [
  { q: "1. What types of vehicles are available at Abhi Cabs 24×7?", a: "Abhi Cabs 24×7 offers Swift Dzire, Ertiga, Innova, Innova Hycross, Tempo Traveller, Force Urbania, and BharatBenz buses for local, airport, outstation, and group travel." },
  { q: "2. Can I book an outstation cab for travel across India?", a: "Yes. Abhi Cabs 24×7 provides outstation cab booking services with pickups from Karnataka, Andhra Pradesh, Maharashtra, and Telangana to destinations across India." },
  { q: "3. Does Abhi Cabs 24×7 provide hourly cab rentals?", a: "Yes, we offer hourly cab rental services for city sightseeing, shopping, business meetings, and personal travel." },
  { q: "4. Can I book a Tempo Traveller for family and group trips?", a: "Yes. You can book Tempo Traveller rentals with Abhi Cabs 24×7 for family vacations, pilgrimages, corporate outings, sightseeing, and group tours." },
  { q: "5. Which vehicles are suitable for small families?", a: "Swift Dzire, Ertiga, Innova, and Innova Hycross are suitable options depending on your passenger count, luggage, and travel requirements." },
  { q: "6. Can I book a cab for round-trip travel?", a: "Yes. Abhi Cabs 24×7 offers round-trip cab bookings for business travel, family vacations, sightseeing, and long-distance outstation journeys." },
  { q: "7. Which vehicle is best for large group transportation?", a: "For larger groups, Tempo Traveller, Force Urbania, and BharatBenz bus rentals are suitable options depending on the number of passengers and travel requirements." },
  { q: "8. Are airport pickup and drop-off services available?", a: "Yes. Abhi Cabs 24×7 offers airport taxi booking services from supported locations, with different vehicle options based on passenger and luggage requirements." },
  { q: "9. Can I book buses for weddings and corporate events?", a: "Yes. Abhi Cabs 24×7 provides bus and group vehicle rentals for weddings, corporate events, family tours, and school or college trips." },
  { q: "10. How can I book a vehicle with Abhi Cabs 24×7?", a: "Visit abhicabs24x7.com, explore our fleet, choose your preferred vehicle, enter your travel details, and submit your cab booking request." },
];

export default function FleetPage() {
  const cms = usePageContent("fleet");
  const { grouped: fleet, loading, error, retry } = useVehicleCatalogue();
  const tabs = TABS.filter((t) => t.id === "all" || fleet.some((v) => v.category === t.id));
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [variantOverrides, setVariantOverrides] = useState({});

  function resolveVariant(v) {
    if (!v.variants) return v;
    const picked = variantOverrides[v.groupKey];
    if (picked) {
      const found = v.variants.find((m) => m.key === picked);
      if (found) return { ...found, variants: v.variants };
    }
    return v;
  }

  const filtered = activeTab === "all" ? fleet : fleet.filter((v) => v.category === activeTab);

  function openModal(v) { setSelectedVehicle(v); setActiveImg(0); document.body.style.overflow = "hidden"; }
  function closeModal() { setSelectedVehicle(null); document.body.style.overflow = ""; }

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="/images/tea-garden-road.jpg" alt="Abhi Cabs fleet" fetchPriority="high" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.72) 48%, rgba(10,10,10,0.40) 100%)" }} />
        </div>
        <div style={{ position: "relative", maxWidth: 1264, margin: "0 auto", padding: "clamp(52px,7vw,96px) 24px" }}>
          <Reveal as="h1" className="ac-hero-fade-up" style={{ fontSize: "clamp(28px,4.2vw,46px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, maxWidth: 1200 }}>
            Our Fleet – <span className="ac-h1-highlight">Cab Rental & Vehicle Booking Services</span> Across India
          </Reveal>
          <Reveal delay={0.1}>
            <h3 style={{ fontSize: "clamp(15px,1.6vw,18px)", color: "rgba(255,255,255,0.9)", marginTop: 12, fontWeight: 600 }}>
              Find Your Perfect Ride with Abhi Cabs 24×7
            </h3>
          </Reveal>
          <Reveal delay={0.15}>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginTop: 14, maxWidth: 800, lineHeight: 1.8 }}>
              Explore the wide range of vehicles at <span className="ac-mark-d">Abhi Cabs 24×7</span>, your travel partner for comfortable and convenient journeys. From budget-friendly sedans and spacious SUVs to Tempo Travellers, Urbania, and luxury coaches, we offer <span className="ac-em-d">cab rentals with professional drivers</span> for airport transfers, local trips, hourly rentals, outstation journeys, round trips, and group travel.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ EXPLORE THE FLEET — Tabs + Grid ═══ */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-2" title="Explore the Abhi Cabs 24×7 Fleet" />
          </Reveal>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap justify-center mb-10 mt-8">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold border-2 transition-all ${
                  activeTab === t.id
                    ? "bg-primary text-white border-primary shadow-brand"
                    : "bg-white text-text-secondary border-border hover:border-primary hover:text-primary"
                }`}
              >
                {t.icon === "all" && <IconCar className="w-4 h-4" />}
                {t.icon === "sedan" && <IconCar className="w-4 h-4" />}
                {t.icon === "suv" && <IconCar className="w-4 h-4" />}
                {t.icon === "luxury" && <IconStar className="w-4 h-4" />}
                {t.icon === "tempo" && <IconTruck className="w-4 h-4" />}
                {t.icon === "bus" && <IconBus className="w-4 h-4" />}
                {t.label}
              </button>
            ))}
          </div>

          {/* Category description */}
          {activeTab !== "all" && CATEGORY_INFO[activeTab] && (
            <div className="max-w-[640px] mx-auto text-center mb-8">
              <h3 className="text-[20px] font-bold">{CATEGORY_INFO[activeTab].title}</h3>
              <p className="text-text-secondary mt-1.5 text-[14.5px]">{CATEGORY_INFO[activeTab].desc}</p>
            </div>
          )}

          {(loading || error || !filtered.length) && (
            <div className="bg-white border border-border rounded-2xl py-12 px-6 text-center text-text-secondary">
              {loading ? "Loading our fleet…" : error ? (
                <>
                  <p className="mb-3">We couldn't load the fleet right now.</p>
                  <button onClick={retry} className="border-2 border-primary text-primary font-bold px-5 py-2 rounded-[10px]">Try again</button>
                </>
              ) : "No vehicles in this category right now."}
            </div>
          )}

          {/* Vehicle grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((entry) => {
              const v = resolveVariant(entry);
              return (
                <FleetCard
                  key={entry.groupKey || entry.id}
                  vehicle={v}
                  onView={() => openModal(v)}
                  onSwitchVariant={(picked) => setVariantOverrides((prev) => ({ ...prev, [entry.groupKey]: picked.key }))}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CAB RENTAL OPTIONS FOR EVERY TRAVEL NEED ═══ */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-11" title="Cab Rental Options for Every Travel Need" />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RENTAL_OPTIONS.map((o, i) => (
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

      {/* ═══ WHY CHOOSE THE ABHI CABS 24×7 FLEET? ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight text-center">Why Choose the Abhi Cabs 24×7 Fleet?</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2 text-center">The Right Vehicle for Every Travel Need</h3>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {WHY_CHOOSE.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.06}>
                <Card className="p-6 h-full ac-card-hover">
                  <h4 className="text-[15px] font-bold">{w.title}</h4>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{w.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOOK YOUR PREFERRED VEHICLE — STATES ═══ */}
      <section className="py-14 md:py-20" style={{ background: "linear-gradient(135deg,#1C1C1C,#0a0a0a)" }}>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
              Book Your Preferred Vehicle for Travel Across India
            </h2>
            <h3 style={{ fontSize: "clamp(15px,1.5vw,18px)", fontWeight: 600, color: "#FFD54F", marginTop: 10, textAlign: "center" }}>
              Cab Rentals from Karnataka, Andhra Pradesh, Maharashtra & Telangana
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 740, margin: "16px auto 0", textAlign: "center" }}>
              Abhi Cabs 24×7 provides cab and vehicle rental services with pickups from <span className="ac-mark-d">Karnataka, Andhra Pradesh, Maharashtra, and Telangana</span> to destinations across India. Whether you need a sedan for airport travel, an SUV for a family vacation, or a Tempo Traveller for group transportation, find the right vehicle for your journey.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQs ═══ */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[860px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-9" title="Frequently Asked Questions About the Abhi Cabs 24×7 Fleet" /></Reveal>
          <div className="space-y-3">
            {FLEET_FAQS.map(({ q, a }) => (
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
        id="fleet-cta"
        onBookMode={() => { if (typeof window !== "undefined") document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        line1="Book Your Cab Online"
        line2="with Abhi Cabs 24×7"
        description="Your Journey, Your Choice of Vehicle. Looking for a suitable vehicle for your next trip? Abhi Cabs 24×7 offers sedans, SUVs, Tempo Travellers, Urbania, and buses for local travel, airport transfers, outstation journeys, hourly rentals, and round trips. Explore our fleet, select your preferred vehicle, and book your next journey with Abhi Cabs 24×7."
        primaryLabel="Explore Vehicles & Book Now"
        secondary={false}
      />

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleModal
          vehicle={selectedVehicle}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
          onClose={closeModal}
          onSwitchVariant={(picked) => {
            setSelectedVehicle({ ...picked, variants: selectedVehicle.variants });
            setActiveImg(0);
          }}
        />
      )}
    </>
  );
}

// ─── Fleet Card ──────────────────────────────────────────────────────────────
function FleetCard({ vehicle: v, onView, onSwitchVariant }) {
  const catColors = {
    sedan:  "bg-blue-50 text-blue-700",
    suv:    "bg-green-50 text-green-700",
    luxury: "bg-purple-50 text-purple-700",
    tempo:  "bg-orange-50 text-orange-700",
    bus:    "bg-red-50 text-red-700",
  };
  return (
    <div className="bg-white overflow-hidden flex flex-col group hover:shadow-lifted transition-shadow" style={{ borderRadius: 18, border: "1px solid var(--color-border)" }}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={v.img} alt={v.name} loading="lazy" onError={(e) => { if (v.imgFallback && e.currentTarget.src !== v.imgFallback) e.currentTarget.src = v.imgFallback; }} className="vehicle-photo w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
        <span className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${catColors[v.category] || "bg-gray-100 text-gray-600"}`}>{v.category}</span>
        {!v.ac && <span className="absolute top-2.5 right-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-800 text-white">Non A/C</span>}
        {v.gallery?.length > 1 && <span className="absolute bottom-2.5 right-2.5 text-[11px] bg-black/50 text-white px-2 py-0.5 rounded-full flex items-center gap-1">{v.gallery.length} photos</span>}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-[15px] leading-tight">{v.name}</h3>
        <div className="flex gap-3 text-[12.5px] text-text-secondary">
          <span className="flex items-center gap-1"><IconSeat className="w-3.5 h-3.5" />{v.seats} Seats</span>
          <span className="flex items-center gap-1"><IconAC className="w-3.5 h-3.5" />{v.ac ? "A/C" : "Non-A/C"}</span>
          {v.bags && <span className="flex items-center gap-1"><IconLuggage className="w-3.5 h-3.5" />{v.bags}</span>}
        </div>
        {v.variants && v.variants.length > 1 && onSwitchVariant && (
          <div className="mt-0.5"><FuelToggle variants={v.variants} activeKey={v.key} onChange={onSwitchVariant} size="sm" /></div>
        )}
        <p className="text-[12.5px] text-text-secondary flex-1 line-clamp-2">{v.tagline}</p>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <div className="bg-[#f4f6ff] rounded-[8px] px-2.5 py-1.5 text-center">
            <div className="text-[10px] text-text-secondary font-semibold">{v.rate ? `Local/${v.rate.hours}hr` : "Local"}</div>
            <div className="text-[14px] font-extrabold text-primary">{v.rate ? fmtINR(v.rate.packageFare) : "On request"}</div>
          </div>
          <div className="bg-[#f4fff6] rounded-[8px] px-2.5 py-1.5 text-center">
            <div className="text-[10px] text-text-secondary font-semibold">Outstation</div>
            <div className="text-[14px] font-extrabold text-success">Live quote</div>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={onView} className="flex-1 border border-primary text-primary text-[13px] font-bold py-2 rounded-[10px] hover:bg-primary-tint transition-colors">View Details</button>
          <Button href="#booking" size="sm" className="flex-1 text-[13px]">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Detail Modal ─────────────────────────────────────────────────────
function VehicleModal({ vehicle: v, activeImg, setActiveImg, onClose, onSwitchVariant }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[20px] w-full max-w-[860px] max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10 rounded-t-[20px]">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold">{v.name}</h2>
            {v.variants && v.variants.length > 1 && onSwitchVariant && (
              <FuelToggle variants={v.variants} activeKey={v.key} onChange={onSwitchVariant} size="md" />
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
          <div>
            <div className="rounded-[14px] overflow-hidden aspect-[16/9] mb-3">
              <img src={v.gallery?.[activeImg] || v.img} alt={v.name} onError={(e) => { if (v.imgFallback && e.currentTarget.src !== v.imgFallback) e.currentTarget.src = v.imgFallback; }} className="vehicle-photo w-full h-full object-cover object-center" />
            </div>
            {v.gallery?.length > 1 && (
              <div className="flex gap-2">
                {v.gallery.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`rounded-[8px] overflow-hidden w-20 aspect-[4/3] border-2 transition-all ${activeImg === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={src} alt="" onError={(e) => { if (v.imgFallback && e.currentTarget.src !== v.imgFallback) e.currentTarget.src = v.imgFallback; }} className="w-full h-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}
            {v.detail && <p className="mt-4 text-[14px] text-text-secondary leading-relaxed">{v.detail}</p>}
            {v.features?.length > 0 && (
              <div className="mt-5">
                <h3 className="font-bold text-[15px] mb-3">Features & Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {v.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[13.5px] text-text-secondary"><IconCheck className="w-4 h-4 text-success shrink-0" />{f}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-[#f8f9fc] rounded-[14px] p-4 grid grid-cols-2 gap-3">
              {[["Seats", `${v.seats} Passengers`], ["Luggage", v.bags || "—"], ["A/C", v.ac ? "Yes" : "No"], ["Fuel", v.fuel || "—"], ["Transmission", v.transmission || "—"]].map(([label, val]) => (
                <div key={label}>
                  <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide">{label}</div>
                  <div className="text-[15px] font-bold mt-0.5">{val}</div>
                </div>
              ))}
            </div>
            <div className="border border-border rounded-[14px] p-4">
              <h3 className="font-bold text-[15px] mb-3">Rate Card</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[11.5px] text-text-secondary font-semibold uppercase tracking-wide mb-1">Local Package</div>
                  {v.rate ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[13.5px] text-text-secondary">{v.rate.hours} hrs / {v.rate.km} km</span>
                        <span className="text-[18px] font-extrabold text-primary">{fmtINR(v.rate.packageFare)}</span>
                      </div>
                      <div className="text-[12px] text-text-secondary mt-0.5">Extra km: {fmtINR(v.rate.extraPerKm)}/km · Extra hr: {fmtINR(v.rate.extraPerHour)}/hr</div>
                    </>
                  ) : (
                    <div className="text-[13.5px] text-text-secondary">Fare on request for this vehicle.</div>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-[11.5px] text-text-secondary font-semibold uppercase tracking-wide mb-1">Outstation / One Way</div>
                  <div className="text-[13.5px] text-text-secondary">Priced live for your exact route — enter pickup and drop to see the fare.</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2 text-[12px] text-amber-700">
                  The exact fare, including any applicable surcharge, is confirmed before you pay.
                </div>
              </div>
            </div>
            <div className="bg-success-tint rounded-[14px] p-4">
              <h3 className="font-bold text-[14px] mb-2.5 text-success">Included in Fare</h3>
              {["Fuel charges", "Driver charges", "GST (corporate bookings)", "24×7 support"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px] text-success mb-1.5"><IconCheck className="w-3.5 h-3.5 shrink-0" /> {item}</div>
              ))}
            </div>
            <div className="bg-red-50 rounded-[14px] p-4">
              <h3 className="font-bold text-[14px] mb-2.5 text-red-600">Charged Extra</h3>
              {["Toll fees & state taxes", "Parking charges", "Airport entry charges", "Night charges (if applicable)"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px] text-red-600 mb-1.5"><IconChevronRight className="w-3.5 h-3.5 shrink-0" /> {item}</div>
              ))}
            </div>
            <Button href="#booking" size="lg" block>Book This Vehicle</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
