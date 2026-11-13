import { useRef, useState, useEffect } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";

/**
 * CountUp — animates a stat up from zero when it scrolls into view (the
 * "number ticker" from MagicUI), built on framer-motion. Accepts a display
 * string and keeps any prefix/suffix: "10,000+" → counts to 10,000 and shows
 * "+"; "4.8★" → counts to 4.8 then "★"; "98%" → "98%". Strings with no number
 * ("< a few hrs") render as-is. Honours prefers-reduced-motion.
 */
export default function CountUp({ value, duration = 1.4, className, style }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  const m = String(value).match(/^([^\d]*)([\d,.]+)(.*)$/);
  const prefix = m ? m[1] : "";
  const numStr = m ? m[2] : "";
  const suffix = m ? m[3] : "";
  const target = m ? Number(numStr.replace(/,/g, "")) || 0 : 0;
  const decimals = (numStr.split(".")[1] || "").length;
  const grouped = numStr.includes(",");

  const [disp, setDisp] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!m || reduce || !inView) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisp(v),
    });
    return () => controls.stop();
  }, [inView, reduce, target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!m) return <span ref={ref} className={className} style={style}>{value}</span>;

  const fmt = (v) => {
    const s = decimals ? v.toFixed(decimals) : String(Math.round(v));
    return grouped ? Number(s).toLocaleString("en-IN") : s;
  };

  return <span ref={ref} className={className} style={style}>{prefix}{fmt(disp)}{suffix}</span>;
}
