import React from "react";
import BookingWidget from "./BookingWidget";
import Reveal from "./ui/Reveal";

/**
 * The exact Home-hero booking card (BookingWidget), reusable on service pages.
 * Submitting creates a journey in the store and goes to /booking-search — the
 * same live fare lookup + booking flow as the Home page. No separate logic.
 *
 * Remount (via `widgetKey`) to switch trip type / preset a route.
 */
export default function ServiceBooking({ widgetKey, initialMode = "one-way", presetPickup = "", presetDrop = "", id = "booking", className = "" }) {
  return (
    <Reveal y={28}>
      <div
        id={id}
        className={className}
        style={{
          width: "100%", maxWidth: 1120, scrollMarginTop: 96,
          background: "#fff", borderRadius: 22, overflow: "hidden",
          boxShadow: "0 30px 70px rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <BookingWidget key={widgetKey} initialMode={initialMode} presetPickup={presetPickup} presetDrop={presetDrop} />
      </div>
    </Reveal>
  );
}

export function scrollToBooking(id = "booking") {
  if (typeof document === "undefined") return;
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
}
