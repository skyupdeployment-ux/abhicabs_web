import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Breadcrumb from "./Breadcrumb";

/**
 * Shared inner-page hero (photo + dark wash + yellow glow), matching the Home hero.
 *  - `center` centres the copy (use when a BookingWidget sits under it, like Home)
 *  - `children`  → content under the copy (booking card)
 *  - `actions`   → buttons row
 *  - `accent`    → yellow tail of the headline
 */
export default function PageHero({ image, imageAlt = "", breadcrumb, title, accent, subtitle, description, actions, stats, center = false, children }) {
  const reduce = useReducedMotion();
  const [more, setMore] = useState(false);
  const longDesc = typeof description === "string" && description.length > 220;
  const rise = (d) => (reduce ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] } });
  return (
    <section className="relative overflow-hidden bg-[#0d0d0d]">
      <img src={image} alt={imageAlt} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
      <div aria-hidden className="absolute inset-0" style={{ background: center ? "linear-gradient(180deg,rgba(13,13,13,.86),rgba(13,13,13,.62) 45%,rgba(13,13,13,.8))" : "linear-gradient(105deg,rgba(13,13,13,.95) 0%,rgba(13,13,13,.78) 48%,rgba(13,13,13,.35) 100%)" }} />
      <div aria-hidden className="absolute -left-24 -bottom-24 w-[380px] h-[380px] rounded-full" style={{ background: "radial-gradient(circle,rgba(255,213,79,.2),transparent 65%)" }} />
      <div className={`relative max-w-[1264px] mx-auto px-5 sm:px-6 py-[clamp(32px,4.5vw,64px)] ${center ? "flex flex-col items-center text-center" : ""}`}>
        {breadcrumb && <Breadcrumb items={breadcrumb} light className={center ? "justify-center" : ""} />}
        <motion.h1 {...rise(0.05)} className={`text-white font-extrabold tracking-tight leading-[1.12] [text-wrap:balance] ${center ? "max-w-[1200px]" : "max-w-[1200px]"}`} style={{ fontSize: "clamp(28px,4vw,46px)", letterSpacing: "-0.03em" }}>
          {title}{accent && <> <span className="text-primary sm:whitespace-nowrap">{accent}</span></>}
        </motion.h1>
        {subtitle && <motion.h2 {...rise(0.09)} className="mt-3 text-primary font-bold leading-snug [text-wrap:balance]" style={{ fontSize: "clamp(17px,1.8vw,22px)" }}>{subtitle}</motion.h2>}
        {description && <motion.p {...rise(0.12)} className={`mt-4 text-white/75 leading-[1.7] [text-wrap:pretty] max-w-[800px] ${longDesc && !more ? "max-sm:line-clamp-4" : ""}`} style={{ fontSize: "clamp(15px,1.4vw,17px)" }}>{description}</motion.p>}
        {longDesc && <button type="button" onClick={() => setMore((v) => !v)} className="sm:hidden mt-2 text-[13.5px] font-bold text-primary underline underline-offset-2" aria-expanded={more}>{more ? "Show less" : "Read more"}</button>}
        {stats && (
          <motion.ul {...rise(0.18)} className={`mt-6 flex flex-wrap gap-x-9 gap-y-3 ${center ? "justify-center" : ""}`}>
            {stats.map(([n, l]) => (
              <li key={l}><div className="text-[clamp(20px,2.2vw,26px)] font-extrabold text-primary leading-none">{n}</div><div className="text-[12.5px] text-white/65 mt-1.5 font-medium">{l}</div></li>
            ))}
          </motion.ul>
        )}
        {actions && <motion.div {...rise(0.24)} className={`mt-8 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>{actions}</motion.div>}
        {children && <div className="w-full mt-7 flex justify-center [&>*]:w-full [&>*]:min-w-0">{children}</div>}
      </div>
    </section>
  );
}
