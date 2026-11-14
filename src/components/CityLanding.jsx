import React from "react";
import {
  MapPin, Car, Plane, Clock, Users, ShieldCheck, Headset, ChevronRight,
  Building, Compass, Calendar, Route as RouteIcon, Star, CheckCircle2,
} from "lucide-react";
import SectionHead from "./ui/SectionHead";
import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import Button from "./ui/Button";
import PageHero from "./ui/PageHero";
import CTASection from "./CTASection";
import ServiceBooking from "./ServiceBooking";

const GOLD = "#E6AC00";
const iconMap = { pin: MapPin, car: Car, plane: Plane, clock: Clock, users: Users, shield: ShieldCheck, headset: Headset, building: Building, compass: Compass, calendar: Calendar, route: RouteIcon, star: Star };

function Section({ children, className = "", white, dark, id }) {
  const bg = dark ? "py-14 md:py-20" : white ? "py-14 md:py-20 bg-white border-y border-border" : "py-14 md:py-20";
  return <section id={id} className={`${bg} ${className}`} style={dark ? { background: "linear-gradient(135deg,#1C1C1C,#0a0a0a)" } : undefined}>{children}</section>;
}

function PlaceGrid({ places }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
      {places.map((p) => (
        <Reveal key={p.name}>
          <Card className="p-6 h-full">
            <h4 className="text-[15px] font-bold">{p.name}</h4>
            <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{p.desc}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

export default function CityLanding({ cfg }) {
  const c = cfg;
  return (
    <>
      {/* ═══ HERO ═══ */}
      <PageHero
        center
        image="/images/dashboard-pov.jpg"
        imageAlt={`Cab services in ${c.cityName}`}
        breadcrumb={[["Home", "/"], ["Cities", "/cities"], [c.cityName, null]]}
        title={c.hero.heading}
        subtitle={c.hero.subheading}
        description={c.hero.description}
      >
        <ServiceBooking widgetKey="city-default" initialMode="one-way" />
      </PageHero>

      {/* ═══ SERVICES ═══ */}
      <Section white>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-11" title={c.services.heading} /></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.services.items.map((s) => (
              <Reveal key={s.title}>
                <Card className="p-6 h-full">
                  <h3 className="text-[16px] font-bold">{s.title}</h3>
                  <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{s.desc}</p>
                  {s.link && <a href={s.link} className="inline-block mt-3 text-[14px] font-bold" style={{ color: GOLD }}>Learn more →</a>}
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FLEET / VEHICLES (Pune, Vizag) ═══ */}
      {c.fleet && (
        <Section>
          <div className="max-w-[1264px] mx-auto px-6">
            <Reveal><SectionHead center className="mb-2" title={c.fleet.heading} /></Reveal>
            <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-4">{c.fleet.subheading}</p></Reveal>
            <Reveal><p className="text-center text-text-secondary text-[15px] max-w-[700px] mx-auto">{c.fleet.intro}</p></Reveal>
            <div className="max-w-[800px] mx-auto mt-8 space-y-3">
              {c.fleet.vehicles.map((v) => (
                <div key={v.label} className="flex items-start gap-3 p-3">
                  <CheckCircle2 size={18} style={{ color: GOLD }} className="shrink-0 mt-0.5" />
                  <p className="text-[15px]"><span className="font-bold">{v.label}:</span> <span className="text-text-secondary">{v.desc}</span></p>
                </div>
              ))}
              {c.fleet.note && <p className="text-[14px] text-text-secondary mt-4">{c.fleet.note}</p>}
            </div>
          </div>
        </Section>
      )}

      {/* ═══ TIRUMALA (Tirupati only) ═══ */}
      {c.tirumala && (
        <Section>
          <div className="max-w-[1264px] mx-auto px-6">
            <Reveal><SectionHead center className="mb-4" title={c.tirumala.heading} /></Reveal>
            <Reveal><p className="text-center text-text-secondary text-[15px] max-w-[700px] mx-auto leading-relaxed">{c.tirumala.intro}</p></Reveal>
            {c.tirumala.pickups && (
              <div className="max-w-[600px] mx-auto mt-6">
                {c.tirumala.pickups.map((p) => (
                  <div key={p} className="flex items-center gap-3 py-2 text-[14px] text-text-secondary"><CheckCircle2 size={16} style={{ color: GOLD }} className="shrink-0" />{p}</div>
                ))}
              </div>
            )}
            {c.tirumala.note && <Reveal><p className="text-center text-text-secondary text-[14px] mt-6 max-w-[640px] mx-auto">{c.tirumala.note}</p></Reveal>}
            {c.tirumala.important && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
                {c.tirumala.important.map((item) => (
                  <Card key={item.title} className="p-5">
                    <h4 className="text-[14px] font-bold">{item.title}</h4>
                    <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                  </Card>
                ))}
              </div>
            )}
            {c.tirumala.disclaimer && <p className="text-center text-[13px] text-text-secondary mt-6 italic">{c.tirumala.disclaimer}</p>}
          </div>
        </Section>
      )}

      {/* ═══ ATTRACTIONS ═══ */}
      <Section white>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.attractions.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-2">{c.attractions.subheading}</p></Reveal>
          <Reveal><p className="text-center text-text-secondary text-[15px] max-w-[700px] mx-auto">{c.attractions.intro}</p></Reveal>
          <PlaceGrid places={c.attractions.places} />
        </div>
      </Section>

      {/* ═══ DAY TRIPS ═══ */}
      <Section>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.dayTrips.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-2">{c.dayTrips.subheading}</p></Reveal>
          <Reveal><p className="text-center text-text-secondary text-[15px] max-w-[700px] mx-auto">{c.dayTrips.intro}</p></Reveal>
          <PlaceGrid places={c.dayTrips.places} />
        </div>
      </Section>

      {/* ═══ OUTSTATION ROUTES ═══ */}
      <Section white>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.outstationRoutes.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-2">{c.outstationRoutes.subheading}</p></Reveal>
          <Reveal><p className="text-center text-text-secondary text-[15px] max-w-[700px] mx-auto mb-8">{c.outstationRoutes.intro}</p></Reveal>
          <div className="max-w-[800px] mx-auto space-y-2">
            {c.outstationRoutes.routes.map((r) => (
              <div key={r.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[rgba(230,172,0,0.04)] transition-colors">
                <ChevronRight size={18} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                <p className="text-[15px]"><span className="font-bold">{r.label}:</span> <span className="text-text-secondary">{r.desc}</span></p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ PICKUP LOCATIONS ═══ */}
      <Section>
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <Reveal><SectionHead center className="mb-2" title={c.pickupLocations.heading} /></Reveal>
          <Reveal><p className="text-[17px] font-bold text-text-secondary mb-4">{c.pickupLocations.subheading}</p></Reveal>
          <Reveal><p className="text-text-secondary text-[15px] leading-relaxed">{c.pickupLocations.intro}</p></Reveal>
          {c.pickupLocations.areas && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {c.pickupLocations.areas.map((a) => (
                <span key={a} className="px-4 py-2 rounded-full border border-border bg-white text-[13px] font-bold text-text-secondary">{a}</span>
              ))}
            </div>
          )}
          {c.pickupLocations.note && <Reveal><p className="text-text-secondary text-[14px] mt-6 leading-relaxed">{c.pickupLocations.note}</p></Reveal>}
        </div>
      </Section>

      {/* ═══ WHY CHOOSE ═══ */}
      <Section white>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.whyChoose.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-11">{c.whyChoose.subheading}</p></Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {c.whyChoose.items.map((w) => (
              <Reveal key={w.title}>
                <Card className="p-6 h-full">
                  <h4 className="text-[15px] font-bold">{w.title}</h4>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">{w.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ HOW TO BOOK ═══ */}
      <Section>
        <div className="max-w-[860px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.howToBook.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-10">{c.howToBook.subheading}</p></Reveal>
          <div className="space-y-6">
            {c.howToBook.steps.map((s, i) => (
              <Reveal key={s.title}>
                <div className="flex gap-5 items-start p-5 rounded-2xl border border-border bg-white">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[18px] shrink-0" style={{ background: "#111", color: GOLD }}>{i + 1}</div>
                  <div><h4 className="text-[16px] font-bold">{s.title}</h4><p className="text-[14px] text-text-secondary mt-1.5 leading-relaxed">{s.desc}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ TIPS ═══ */}
      <Section white>
        <div className="max-w-[1264px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-2" title={c.tips.heading} /></Reveal>
          <Reveal><p className="text-center text-[17px] font-bold text-text-secondary mb-11">{c.tips.subheading}</p></Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[960px] mx-auto">
            {c.tips.items.map((t) => (
              <Card key={t.title} className="p-5">
                <h4 className="text-[14px] font-bold">{t.title}</h4>
                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{t.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FAQs ═══ */}
      <Section>
        <div className="max-w-[860px] mx-auto px-6">
          <Reveal><SectionHead center className="mb-9" title={`Frequently Asked Questions About Cab Booking in ${c.cityName}`} /></Reveal>
          <div className="space-y-3">
            {c.faqs.map(([q, a]) => (
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
      </Section>

      {/* ═══ CTA ═══ */}
      <CTASection
        id={`${c.slug}-cta`}
        onBookMode={() => { if (typeof window !== "undefined") window.location.href = "#booking"; }}
        line1={`Book Your ${c.cityName} Cab`}
        line2="Today."
        subheading={c.cta.subheading}
        description={c.cta.description}
        primaryLabel={c.cta.ctaLabel}
        secondary={false}
      />
    </>
  );
}