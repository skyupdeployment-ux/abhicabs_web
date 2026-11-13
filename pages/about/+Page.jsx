import React, { useEffect, useRef, useState } from "react";
import {
  Car, Plane, Navigation, ShieldCheck, Users, Headset, CalendarCheck,
  Sparkles, Route, Timer, UserCheck, Repeat, Truck, Star,
} from "lucide-react";
import SectionHead from "../../src/components/ui/SectionHead";
import Card from "../../src/components/ui/Card";
import Reveal from "../../src/components/ui/Reveal";
import CTASection from "../../src/components/CTASection";

const GOLD = "#E6AC00";
const GOLDF = "#FFD54F";


function TextSwap({ texts, interval = 2800 }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % texts.length), interval);
    return () => clearInterval(t);
  }, [texts.length, interval]);
  return (
    <span className="ac-swap-wrap">
      {texts.map((t, i) => (
        <span key={t} className={`ac-swap-item ${i === index ? "ac-swap-active" : ""}`}>{t}</span>
      ))}
    </span>
  );
}

/* ── Typewriter ── */
function Typewriter({ text, speed = 30, delay = 0, className, style }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const d = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(d);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, count, text.length, speed]);
  return (
    <span className={className} style={style}>
      {text.slice(0, count)}
      {count < text.length && <span className="ac-cursor" />}
    </span>
  );
}

const SERVICES = [
  { Icon: Plane, label: "Airport Transfers", desc: "Convenient airport pickup and drop-off services." },
  { Icon: Navigation, label: "Outstation Cabs", desc: "Comfortable intercity and interstate cab bookings." },
  { Icon: Car, label: "Local Taxi Services", desc: "Convenient taxi services for city travel and sightseeing." },
  { Icon: Repeat, label: "Round-Trip Cabs", desc: "Flexible round-trip taxi bookings for business, leisure, and family travel." },
  { Icon: Timer, label: "Hourly Cab Rentals", desc: "Flexible hourly taxi rental services for meetings, shopping, sightseeing, and personal travel." },
  { Icon: UserCheck, label: "Driver Services", desc: "Professional driving assistance for your journeys." },
  { Icon: Users, label: "Group Travel", desc: "Spacious vehicle options for families and large groups." },
];

const WHY_CHOOSE = [
  { Icon: ShieldCheck, title: "Safe & Secure Journeys", desc: "Travel with confidence, comfort, and peace of mind." },
  { Icon: UserCheck, title: "Verified & Experienced Drivers", desc: "Skilled, verified drivers focused on passenger safety and comfort." },
  { Icon: Sparkles, title: "Hassle-Free Travel Experience", desc: "Enjoy convenient cab booking and smooth journeys." },
  { Icon: Headset, title: "24×7 Booking Assistance", desc: "Get support for your travel needs anytime." },
  { Icon: Timer, title: "Flexible Cab Rental Options", desc: "Choose from local cabs, hourly rentals, airport transfers, and outstation trips." },
  { Icon: Route, title: "Round-Trip & Interstate Travel", desc: "Convenient cab services for short and long-distance journeys." },
  { Icon: Truck, title: "Vehicles for Every Need", desc: "Choose from 4-seater to 50-seater vehicles for personal and group travel." },
  { Icon: CalendarCheck, title: "Easy Online Cab Booking", desc: "Book your preferred cab quickly and conveniently." },
];

export default function Page() {
  return (
    <>
      {/* Scoped CSS — no external libraries */}
      <style>{`
        /* ── Keyframes ── */
        @keyframes acFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes acSlideIn { from { opacity: 0; transform: translateX(180px) scale(0.92); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes acPopIn { from { opacity: 0; transform: translateY(20px) scale(0.85); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes acBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        /* ── Hero text — FAST staggered fade-up ── */
        .ac-hero-text > *:nth-child(1) { animation: acFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .ac-hero-text > *:nth-child(2) { animation: acFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .ac-hero-text > *:nth-child(3) { animation: acFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.5s both; }
        .ac-hero-text > *:nth-child(4) { animation: acFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.65s both; }
        .ac-hero-text > *:nth-child(5) { animation: acFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.8s both; }
        .ac-hero-text > *:nth-child(6) { animation: acFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) 0.95s both; }

        /* ── Car image — SLOW dramatic slide from right ── */
        .ac-car-enter { animation: acSlideIn 1.6s cubic-bezier(0.16,1,0.3,1) 0.2s both; }

        /* ── Badge — bouncy pop, arrives LAST ── */
        .ac-badge-enter { animation: acPopIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.5s both; }

        /* ── Text swap ── */
        .ac-swap-wrap { display: inline-block; position: relative; overflow: hidden; vertical-align: bottom; height: 1.15em; }
        .ac-swap-item { display: block; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s; transform: translateY(110%); opacity: 0; position: absolute; top: 0; left: 0; white-space: nowrap; }
        .ac-swap-item:first-child { position: relative; }
        .ac-swap-active { transform: translateY(0) !important; opacity: 1 !important; }

        /* ── Typewriter cursor ── */
        .ac-cursor { display: inline-block; width: 2px; height: 1em; background: ${GOLD}; margin-left: 2px; vertical-align: text-bottom; animation: acBlink 0.6s infinite; }

        /* ── Scroll parallax (pure CSS) ── */
        @supports (animation-timeline: scroll()) {
          @keyframes acParallaxUp { to { transform: translateY(-70px) rotate(-1.5deg) scale(0.97); } }
          @keyframes acTextFade { to { opacity: 0.25; transform: translateY(-25px); } }
          .ac-car-scroll { animation: acParallaxUp linear both; animation-timeline: scroll(); animation-range: 0% 60%; }
          .ac-text-scroll { animation: acTextFade linear both; animation-timeline: scroll(); animation-range: 30% 70%; }
        }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-white" style={{ minHeight: "clamp(520px, 72vh, 700px)" }}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 50% at 12% 90%, rgba(230,172,0,0.05) 0%, transparent 60%)" }} />

        <div className="relative max-w-[1264px] mx-auto px-6 h-full flex items-center" style={{ minHeight: "clamp(520px, 72vh, 700px)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center w-full py-16 lg:py-0">

            {/* ── Left: Text — fast staggered entry ── */}
            <div className="relative z-10 max-w-[580px] ac-hero-text ac-text-scroll">
              {/* H1 */}
              <div>
                <h1 className="font-bold tracking-tight leading-[1.05]" style={{ fontSize: "clamp(32px, 5vw, 46px)", letterSpacing: "-0.04em", color: "#0F172A" }}>
                  About Abhi Cabs 24×7 –
                
                  <span style={{ color: GOLD }}>
                    <TextSwap texts={["Reliable Cab Booking.", "Smarter Travel.", "Better Service."]} interval={2800} />
                  </span>
                </h1>
              </div>

              {/* Subtitle — typewriter */}
              <div style={{ minHeight: "1.8em" }}>
                <Typewriter
                  text="Your Trusted Travel Partner for Every Journey"
                  speed={28}
                  delay={500}
                  className="font-bold"
                  style={{ fontSize: "clamp(16px, 1.6vw, 19px)", color: "#334155", lineHeight: 1.6 }}
                />
              </div>

              {/* Description */}
              <div>
                <p className="mt-4 text-[14px] text-[#2b2b2b] text-justify">
                  Welcome to <strong className="text-[#0F172A] font-semibold">Abhi Cabs 24×7</strong>, your trusted travel partner for comfortable, convenient, and hassle-free journeys. We provide{" "}
                  <strong className="text-[#0F172A] font-semibold">online cab booking, airport taxi services, local cabs, outstation cab bookings, round-trip taxi services, hourly cab rentals, and driver services</strong>.
                  With pickups from <strong className="text-[#0F172A] font-semibold">Karnataka, Andhra Pradesh, Maharashtra, and Telangana</strong>, we make travelling to destinations across India simple and convenient.
                </p>
              </div>

              {/* CTA */}
              <div>
                <a href="#booking" className="inline-flex text-[#ffff] items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-[15px] text-[#111] mt-4 transition-shadow hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${GOLD}, #e99400)`, boxShadow: "0 4px 20px rgba(230,172,0,0.3)" }}>
                  <CalendarCheck size={17} />
                  Book a Taxi
                </a>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-2 mt-6">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill={GOLD} color={GOLD} />)}
                <span className="text-[13px] font-bold text-[#475569] ml-1">5-Star Rated Ride Experience</span>
              </div>
            </div>

            {/* ── Right: Car — SLOW entrance + CSS scroll parallax ── */}
            <div className="relative flex items-center justify-center lg:justify-end ac-car-scroll">
              <div className="relative w-full max-w-[620px] lg:max-w-none ac-car-enter">
               
                <img src="/images/aboutus.png" alt="Abhi Cabs premium sedan" fetchPriority="high" className="relative w-full rounded-2xl object-cover"  />
                
              </div>
            </div>
          </div>
        </div>
       
      </section>

      {/* ═══ WHO WE ARE ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-11 lg:gap-16 items-center">
          <Reveal>
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight">Who We Are</h2>
            <h3 className="text-[18px] md:text-[22px] font-bold text-text-secondary mt-2">Making Every Journey Comfortable & Convenient</h3>
            <p className="mt-5 text-text-secondary text-[15.5px] leading-relaxed">
              At Abhi Cabs 24×7, we offer reliable <span className="ac-hl">taxi booking services</span> for individuals, families, businesses, and groups. From short city rides and <span className="ac-hl">hourly cab rentals</span> to long-distance outstation trips, our vehicle options ranging from <span className="ac-hl">4-seaters to 50-seaters</span> help you find the right travel solution for every journey.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <img src="/images/family.webp" alt="Family travelling with Abhi Cabs" loading="lazy" className="rounded-[22px] w-full aspect-[5/4] object-cover" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.14)" }} />
          </Reveal>
        </div>
      </section>

      {/* ═══ OUR CAB SERVICES ═══ */}
      <section id="services" className="py-14 md:py-20 bg-white border-y border-border">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-2" title="Our Cab Services" />
            <p className="text-center text-[17px] md:text-[20px] font-bold text-text-secondary mb-11">Flexible Travel Solutions for Every Need</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <Card className="p-6 h-full ac-card-hover">
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <s.Icon size={21} style={{ color: GOLD }} />
                  </div>
                  <h4 className="text-[15.5px] font-bold">{s.label}</h4>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE ═══ */}
      <section className="py-14 md:py-20">
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <div className="ac-section-divider" />
            <SectionHead center className="mb-2" title="Why Choose Abhi Cabs 24×7?" />
            <p className="text-center text-[17px] md:text-[20px] font-bold text-text-secondary mb-11">Safe, Comfortable & Hassle-Free Travel Across India</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CHOOSE.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.06}>
                <Card className="p-6 h-full ac-card-hover">
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <w.Icon size={21} style={{ color: GOLD }} />
                  </div>
                  <h4 className="text-[15px] font-bold">{w.title}</h4>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{w.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4 STATES ═══ */}
      <section className="py-14 md:py-20" style={{ background: "linear-gradient(135deg,#1C1C1C,#0a0a0a)" }}>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
              Cab Booking Services from Karnataka, Andhra Pradesh, Maharashtra & Telangana
            </h2>
            <h3 style={{ fontSize: "clamp(15px,1.5vw,18px)", fontWeight: 600, color: GOLDF, marginTop: 10, textAlign: "center" }}>
              Travel from Your City to Destinations Across India
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 740, margin: "16px auto 0", textAlign: "center" }}>
              Abhi Cabs 24×7 offers <span className="ac-mark-d">Pan-India taxi services</span>, with pickups from <span className="ac-mark-d">Karnataka, Andhra Pradesh, Maharashtra, and Telangana</span>. Whether you're planning an airport transfer, local journey, hourly cab rental, outstation trip, or round-trip booking, we provide convenient travel options to destinations across India.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CTASection
        id="book-now"
        onBookMode={() => { if (typeof window !== "undefined") window.location.href = "#booking"; }}
        line1="Book Your Cab Online"
        line2="with Abhi Cabs 24×7"
        description="Your Journey, Our Priority. Planning your next trip? Choose Abhi Cabs 24×7 for reliable airport transfers, local taxi services, hourly cab rentals, outstation cabs, and round-trip bookings. Book your preferred vehicle and enjoy a convenient travel experience."
        primaryLabel="Book Your Ride Now"
        secondary={false}
      />
    </>
  );
}