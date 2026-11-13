import EmojiIcon from "../../src/components/ui/EmojiIcon";
import usePageContent from "../../src/hooks/usePageContent";
import React from "react";
import { IconCheck, IconClock, IconPin, IconArrowRight, IconChevronRight } from "../../src/components/Icons";
import { EYEBROW } from "../../src/components/ui/classNames";
import SectionHead from "../../src/components/ui/SectionHead";
import Button from "../../src/components/ui/Button";
import Card from "../../src/components/ui/Card";
import ServiceBooking from "../../src/components/ServiceBooking";
import ServiceInterlink, { BlogInterlink } from "../../src/components/ServiceInterlink";
import useBlogs from "../../src/hooks/useBlogs";

/* ── Route data ─────────────────────────────────────────────────────────── */
const ROUTES = [
  { from: "Bangalore", to: "Mysore",     km: 150, hr: "3",   img: "/images/route-1.webp", tag: "Popular" },
  { from: "Bangalore", to: "Coorg",      km: 260, hr: "5",   img: "/images/route-2.webp", tag: "Weekend" },
  { from: "Bangalore", to: "Ooty",       km: 280, hr: "6",   img: "/images/route-3.webp", tag: "Hill Station" },
  { from: "Bangalore", to: "Goa",        km: 560, hr: "9",   img: "/images/route-4.webp", tag: null },
  { from: "Bangalore", to: "Wayanad",    km: 280, hr: "5.5", img: "/images/route-5.webp", tag: "Nature" },
  { from: "Bangalore", to: "Hampi",      km: 340, hr: "6",   img: "/images/route-6.webp", tag: "Heritage" },
  { from: "Bangalore", to: "Tirupati",   km: 250, hr: "4.5", img: "/images/route-1.webp", tag: "Pilgrimage" },
  { from: "Bangalore", to: "Pondicherry",km: 310, hr: "6",   img: "/images/route-3.webp", tag: "Beach" },
  { from: "Bangalore", to: "Hyderabad",  km: 570, hr: "8",   img: "/images/route-4.webp", tag: null },
];

const TRIP_TYPES = [
  {
    title: "One-Way Drop",
    desc: "Get dropped at your destination and the trip ends there — no need to book a return. Enter your route to see the fare before you confirm.",
    icon: <IconArrowRight className="w-5 h-5" />,
    highlight: "Single direction",
  },
  {
    title: "Round Trip",
    desc: "Outstation and back with the same driver. The car stays with you for the entire trip — explore freely, stop anywhere.",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" /></svg>,
    highlight: "Driver stays with you",
  },
  {
    title: "Multi-City",
    desc: "Cover multiple stops across cities — Bangalore → Mysore → Coorg → Bangalore. One booking, one fare, zero hassle.",
    icon: <IconPin className="w-5 h-5" />,
    highlight: "Multiple stops, one fare",
  },
];

const STEPS = [
  { n: "1", title: "Enter your route", desc: "Pick up, drop off, date and time — your fare shows instantly." },
  { n: "2", title: "Choose your cab", desc: "Sedan, SUV, or tempo traveller. See the exact fare before you pay." },
  { n: "3", title: "Confirm & ride", desc: "Your driver is assigned, GPS-tracked, and ready at your doorstep." },
];

const INCLUDED = [
  "Base fare and fuel charges",
  "Driver allowance (bata)",
  "GST where applicable (shown in fare breakup)",
  "AC vehicle",
];

const EXTRAS = [
  "Toll / State tax (as per actuals)",
  "Parking charges",
  "Extra km beyond package limit",
  "Night driving allowance (9:45 PM – 6 AM) — ₹300/night, paid to driver",
];

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Page() {
  const { blogs: allOutstationBlogs } = useBlogs();
  const outstationBlogs = allOutstationBlogs.filter((b) => {
    const text = ((b.tags || []).join(" ") + " " + (b.category || "") + " " + (b.title || "")).toLowerCase();
    return /outstation|route|road trip|weekend|destination|mysore|coorg|ooty|goa|wayanad|hampi|tirupati|pondicherry|hyderabad/i.test(text);
  }).slice(0, 3);

  const cms = usePageContent("outstation");
  const heroTitle = cms.get("hero", "title", "Outstation cabs,");
  const heroAccent = cms.get("hero", "accent", "priced before you ride");
  const heroDesc = cms.get("hero", "description", "Book an outstation cab with Abhi Cabs — one-way or round trip, with popular routes from Bangalore and the fare shown before you confirm.");
  const ctaText = cms.get("hero", "ctaText", "Get Instant Quote");
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/tea-garden-road.jpg" alt="Open highway through Western Ghats" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>
        <div className="relative max-w-[1264px] mx-auto px-6 py-20 md:py-32">
          <Breadcrumb items={[["Home", "/"], ["Outstation Cabs", null]]} light />
          <h1 className="text-[32px] md:text-[52px] font-bold tracking-tight text-white leading-tight max-w-[1200px]">
            {heroTitle} {heroAccent}
          </h1>
          <p className="mt-4 text-white/80 text-[17px] max-w-[800px]">
            {heroDesc}
          </p>
          <div className="mt-10">
            <ServiceBooking widgetKey="outstation" initialMode="one-way" />
          </div>
          <div className="flex flex-wrap gap-6 mt-9">
            {[["Fare shown first","Before you confirm"],["Round trips","Driver stays with you"],["4 states","Karnataka, AP, Telangana & Maharashtra"]].map(([big,small])=>(
              <div key={big} className="text-white/90">
                <div className="text-[15px] font-bold">{big}</div>
                <div className="text-[12px] text-white/60">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trip Types ─────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <SectionHead
            center
            className="mb-11"
            eyebrow="Trip Types"
            title="One booking format for every kind of outstation trip"
            description="Whether you need a quick one-way drop or a week-long road trip with multiple stops — the booking is the same."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5.5">
            {TRIP_TYPES.map((t) => (
              <Card key={t.title} className="p-6 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary flex items-center justify-center mb-4">{t.icon}</div>
                <h3 className="text-[18px] font-bold">{t.title}</h3>
                <p className="text-[14.5px] text-text-secondary mt-2 flex-1">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                  <IconCheck className="w-4 h-4" /> {t.highlight}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6">
          <SectionHead center className="mb-12" eyebrow="How It Works" title="Book in under a minute" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[880px] mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-white text-[22px] font-extrabold flex items-center justify-center mx-auto shadow-brand">{s.n}</div>
                {i < STEPS.length - 1 && <div className="hidden md:block h-0.5 bg-border w-full mt-7 -mb-7" />}
                <h4 className="mt-5 text-[16px] font-bold">{s.title}</h4>
                <p className="mt-2 text-[14px] text-text-secondary max-w-[240px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="#booking" size="lg">Book Now</Button>
          </div>
        </div>
      </section>

      {/* ── Popular Routes ─────────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <SectionHead className="mb-10" eyebrow="Popular Routes" title="Most booked outstation routes from Bangalore" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ROUTES.map((r) => (
              <a
                key={`${r.from}-${r.to}`}
                href="#booking"
                className="group bg-white border border-border rounded-[16px] overflow-hidden hover:shadow-lifted transition-shadow flex flex-col"
              >
                <div className="relative aspect-[16/8] overflow-hidden">
                  <img src={r.img} alt={`${r.from} to ${r.to}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {r.tag && (
                    <span className="absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-primary">{r.tag}</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[16px] font-bold">
                    <span>{r.from}</span>
                    <IconArrowRight className="w-4 h-4 text-primary" />
                    <span>{r.to}</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-[13px] text-text-secondary">
                    <span className="flex items-center gap-1"><IconPin className="w-3.5 h-3.5" /> {r.km} km</span>
                    <span className="flex items-center gap-1"><IconClock className="w-3.5 h-3.5" /> ~{r.hr} hrs</span>
                  </div>
                  <div className="mt-3 text-[13px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Get fare <IconChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's Included ────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-primary-tint border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <SectionHead eyebrow="Transparent Pricing" title="Everything included in your fare" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck className="w-3 h-3" />
                  </div>
                  <span className="text-[14.5px] text-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[20px] font-bold mt-1 mb-5">Charged separately (at actuals)</h3>
            <div className="space-y-3">
              {EXTRAS.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[14.5px] text-text-secondary">
                  <IconChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-white border border-border rounded-[14px] p-4 mt-6">
              <p className="text-[13.5px] text-text-secondary">
                The exact fare — including any applicable night charge or surcharge — is confirmed on the checkout page before you pay. No surprises, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why AbhiCabs ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1264px] mx-auto px-6">
          <SectionHead center className="mb-11" eyebrow="Why AbhiCabs" title="Built for outstation, not retrofitted" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ["Upfront fares", "See the exact price before you book. The fare on checkout is the fare you pay — toll and parking are at actuals.", "💰"],
              ["Verified drivers", "Every driver is KYC-verified, background-checked, and rated by passengers. No random assignments.", "🛡️"],
              ["Live GPS tracking", "Track your cab in real time. Share the trip link with family so they know you're safe.", "📍"],
              ["24×7 support", "A real person picks up the phone — not a chatbot. Call, WhatsApp, or email, any hour.", "📞"],
            ].map(([title, desc, emoji]) => (
              <Card key={title} className="p-5.5 text-center">
                <div className="mb-3 flex justify-center"><EmojiIcon glyph={emoji} size={32} color="#F5A623" /></div>
                <h4 className="text-[16px] font-bold">{title}</h4>
                <p className="text-[13.5px] text-text-secondary mt-2">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog guides & Service interlinks ─────────────────────────── */}
      {outstationBlogs.length > 0 && (
        <BlogInterlink blogs={outstationBlogs} title="Destination Guides & Tips" className="border-t border-border" />
      )}

      <ServiceInterlink exclude="/outstation" title="More Ways to Travel" className="bg-[#FAFAFA] border-y border-border" />

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="pb-14 md:pb-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <div className="bg-gradient-to-br from-primary-dark to-primary rounded-[22px] p-9 md:p-13 text-white grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-7.5 items-center">
            <div>
              <h2 className="text-[30px] font-bold tracking-tight">Get your fare in 10 seconds</h2>
              <p className="mt-3 text-white/85 text-[15.5px]">
                Enter your pickup and destination — the fare, vehicle options, and estimated time appear instantly. No login needed.
              </p>
            </div>
            <div className="flex lg:justify-end gap-3">
              <Button href="#booking" variant="inverse" size="lg">Get Instant Quote</Button>
              <Button href="/contact-us" variant="outlineInverse" size="lg">Talk to Us</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────── */
function Breadcrumb({ items, light }) {
  return (
    <div className={`flex items-center gap-2 text-[13.5px] mb-3.5 ${light ? "text-white/60" : "text-text-secondary"}`}>
      {items.map(([label, href], i) => (
        <React.Fragment key={label}>
          {i > 0 && <span>/</span>}
          {href ? <a href={href} className={`font-semibold ${light ? "hover:text-white" : "hover:text-primary"}`}>{label}</a> : <span>{label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
