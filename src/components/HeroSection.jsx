import usePageContent from "../hooks/usePageContent";
import React, { useRef } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  MotionConfig,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import BookingWidget from "./BookingWidget";

/* ------------------------------------------------------------------ */
/* Motion tokens — one orchestrated page-load sequence, nothing else. */
/* ------------------------------------------------------------------ */
const EASE_OUT = [0.22, 1, 0.36, 1];

const heroContent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

// Headline lines reveal from under a mask (parent has overflow: hidden)
const headlineLine = {
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: 0.85, ease: EASE_OUT } },
};

const featureGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const featureItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

const checkIcon = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { type: "spring", stiffness: 420, damping: 18 } },
};

const DEFAULT_FEATURES = ["Verified Drivers", "Transparent Pricing", "Comfortable Vehicles", "24×7 Support"];

export default function HeroSection({ widgetKey, widgetProps, onModeChange }) {
  const cms = usePageContent("home");
  const heroTitle = cms.get("hero", "title", "Your Journey,");
  const heroAccent = cms.get("hero", "accent", "Our Priority.");
  const heroDesc = cms.get("hero", "description", "Reliable Cabs. Transparent Fares. Comfortable Travel. Book reliable cabs for airport transfers, local travel, one-way trip, round trip, group trip and outstation journeys.");
  const heroImage = cms.get("hero", "image", "");
  const FEATURES = cms.getItems("features", "items", DEFAULT_FEATURES.map(f => typeof f === "string" ? { title: f } : f)).map(f => typeof f === "string" ? f : f.title || f);

  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Subtle parallax on the background photo while the hero scrolls out.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReducedMotion ? "0%" : "12%"]);

  return (
    // LazyMotion + `m` keeps the bundle small (~5kb vs ~34kb for full `motion`).
    // reducedMotion="user" auto-disables transform animations for users who opt out.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {/* HERO */}
        <section
          ref={heroRef}
          style={{ position: "relative", background: "#0d0d0d", overflow: "hidden" }}
        >
          {/* Photo layer: extended 15% above so parallax never exposes a gap */}
          <m.div
            style={{
              position: "absolute",
              top: "-15%",
              left: 0,
              right: 0,
              bottom: 0,
              y: bgY,
              willChange: "transform",
            }}
          >
            <m.img
              src={heroImage || "/images/Herosection.jpg"}
              alt=""
              fetchPriority="high"
              decoding="async"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.6, ease: EASE_OUT }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </m.div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(13,13,13,.85) 0%,rgba(13,13,13,.6) 40%,rgba(13,13,13,.5) 65%,rgba(13,13,13,.75) 100%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              maxWidth: 1280,
              margin: "0 auto",
              padding: "clamp(48px,6vw,72px) 22px clamp(40px,5vw,60px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* ── Hero text — centered ── */}
            <m.div
              variants={heroContent}
              initial="hidden"
              animate="show"
              style={{ maxWidth: 1200, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <h1
                className="hero-h1"
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(34px,5.5vw,64px)",
                  lineHeight: 1.05,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-.025em",
                  whiteSpace: "nowrap",
                }}
              >
                <m.span variants={headlineLine} style={{ display: "inline" }}>
                  {heroTitle}
                </m.span>
                {" "}
                <m.span
                  variants={headlineLine}
                  className="hero-h1-accent"
                  style={{ display: "inline", color: "#FFD54F" }}
                >
                  {heroAccent}
                </m.span>
              </h1>

              <m.p
                variants={fadeUp}
                style={{
                  fontSize: "clamp(14px,1.5vw,17px)",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,.7)",
                  fontWeight: 400,
                  margin: "16px 0 0",
                  maxWidth: 700,
                }}
              >
                {heroDesc}
              </m.p>

              <m.div
                variants={featureGrid}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "10px 28px",
                  marginTop: 20,
                }}
              >
                {FEATURES.map((f) => (
                  <m.span
                    key={f}
                    variants={featureItem}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: 13.5,
                    }}
                  >
                    <m.svg variants={checkIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#FFD54F" />
                      <path
                        d="M8 12.5l2.5 2.5 5-5.5"
                        stroke="#111"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </m.svg>
                    {f}
                  </m.span>
                ))}
              </m.div>
            </m.div>

            {/* ── Booking widget — centered inside hero ── */}
            <m.div
              id="booking"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT }}
              style={{
                width: "100%",
                maxWidth: 1120,
                marginTop: "clamp(28px,4vw,44px)",
                background: "#fff",
                borderRadius: 22,
                boxShadow: "0 30px 70px rgba(0,0,0,.28)",
                border: "1px solid rgba(255,255,255,.12)",
                overflow: "hidden",
              }}
            >
              <BookingWidget key={widgetKey} {...widgetProps} onModeChange={onModeChange} />
            </m.div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}