import React, { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { IconWhatsapp } from "../Icons";

/** Mobile-only sticky Call / WhatsApp / Book bar. Hides itself near the footer,
 *  while a form field has focus (on-screen keyboard), and for unconfigured actions. */
export default function ContactActions({ phoneHref, whatsappHref, onBook }) {
  const [nearFooter, setNearFooter] = useState(false);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    let io;
    if (footer && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => setNearFooter(e.isIntersecting), { threshold: 0 });
      io.observe(footer);
    }
    const on = (e) => setTyping(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
    const off = () => setTyping(false);
    document.addEventListener("focusin", on); document.addEventListener("focusout", off);
    return () => { io?.disconnect(); document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);
  if (nearFooter || typing) return null;
  const btn = "flex-1 h-12 rounded-full inline-flex items-center justify-center gap-2 text-[14px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6AC00]";
  return (
    <div role="region" aria-label="Quick contact actions" className="md:hidden fixed inset-x-0 bottom-0 z-[150] bg-white/95 backdrop-blur border-t border-border px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex gap-2 shadow-[0_-6px_20px_rgba(0,0,0,.06)]">
      {phoneHref && <a href={phoneHref} className={`${btn} border-2 border-[#111]`}><Phone size={16} aria-hidden /> Call</a>}
      {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${btn} border-2 border-[#111]`}><IconWhatsapp className="w-4 h-4" /> WhatsApp</a>}
      <button type="button" onClick={onBook} className={`${btn} bg-primary text-[#111]`}>Book Now</button>
    </div>
  );
}
