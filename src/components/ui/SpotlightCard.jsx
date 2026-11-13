import { useRef, useState } from "react";

/**
 * SpotlightCard — a soft radial glow that follows the cursor across the card
 * (the "spotlight" effect from Aceternity UI), done with plain React + CSS, no
 * dependencies. Desktop-only by nature (pointer); harmless on touch. Wrap any
 * card content; pass the usual className for the card's own styling.
 */
export default function SpotlightCard({ children, className, style, color = "rgba(245,166,35,0.16)", radius = 260 }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, on: false });

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, on: false }))}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: pos.on ? 1 : 0,
          transition: "opacity 0.3s ease",
          background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)`,
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
