import React, { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import ServiceLanding from "../ServiceLanding";
import { toServiceCfg } from "../../lib/servicePage";

const WIDTHS = { desktop: 1280, mobile: 390 }; // render at a real device width, scale down to fit the panel

/**
 * The ACTUAL service-page template (<ServiceLanding>, the exact component visitors get), rendered from
 * the draft content as you type — no save, no iframe. Desktop / Mobile switch. Scroll-only: nothing
 * inside the preview is clickable, so nothing navigates away.
 */
export default function ServicePreview({ slug, content, liveUrl, height = "100%" }) {
  const [device, setDevice] = useState("desktop");
  const wrap = useRef(null);
  const inner = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [innerH, setInnerH] = useState(1200);
  const W = WIDTHS[device];

  useEffect(() => {
    const measure = () => {
      if (wrap.current) setScale(Math.min(1, (wrap.current.clientWidth - (device === "mobile" ? 24 : 0)) / W));
      if (inner.current) setInnerH(inner.current.scrollHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    wrap.current && ro.observe(wrap.current);
    inner.current && ro.observe(inner.current);
    return () => ro.disconnect();
  }, [W, device]);

  let cfg = null, err = "";
  try { cfg = toServiceCfg(slug, content); } catch (e) { err = e.message; }

  const tab = (id, Icon, label) => (
    <button type="button" onClick={() => setDevice(id)} aria-pressed={device === id}
      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: device === id ? "#fff" : "transparent", color: device === id ? "#111" : "#9CA3AF" }}>
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div style={{ height, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#0a0a0a", color: "#fff", flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "#34D399" }} aria-hidden />
        <span style={{ fontSize: 12.5, fontWeight: 800 }}>Live preview</span>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>the real page template · updates as you type</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: "rgba(255,255,255,.1)", borderRadius: 10, padding: 2 }}>{tab("desktop", Monitor, "Desktop")}{tab("mobile", Smartphone, "Mobile")}</div>
        {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" style={{ background: "#F5A623", color: "#0a0a0a", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 800, textDecoration: "none" }}>Open live ↗</a>}
      </div>
      <div ref={wrap} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", background: "#E5E7EB" }}>
        {err ? <div style={{ padding: 20, color: "#B91C1C", fontSize: 13 }}>Preview error: {err}</div> : (
          <div style={{ height: innerH * scale, position: "relative" }}>
            <div ref={inner} aria-hidden style={{ width: W, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none", position: "absolute", top: 0, left: device === "mobile" ? Math.max(0, ((wrap.current?.clientWidth || W * scale) - W * scale) / 2) : 0, background: "#fff" }}>
              <ServiceLanding key={slug + device} cfg={cfg} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
