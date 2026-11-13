import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import useBusinessInfo from "../hooks/useBusinessInfo";

// Pages that show a fixed bottom action bar on mobile — lift the badge above it.
const HAS_BOTTOM_BAR = ["/booking-search", "/cab-details", "/checkout", "/payment"];
// Pages where a customer chat button doesn't belong.
const HIDDEN_ON = ["/admin"];

/** Floating WhatsApp badge, fixed bottom-right on every public page. Uses the configured business number. */
export default function WhatsAppFloat() {
  const path = usePageContext().urlPathname || "/";
  const { whatsappHref } = useBusinessInfo();
  if (!whatsappHref || HIDDEN_ON.some((p) => path.startsWith(p))) return null; // no number configured → no broken link
  const lifted = HAS_BOTTOM_BAR.some((p) => path.startsWith(p));
  return (
    <a
      href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with Abhi Cabs on WhatsApp (opens in a new tab)"
      className={`group fixed right-4 sm:right-6 z-[140] flex items-center gap-3 ${lifted ? "bottom-[calc(env(safe-area-inset-bottom)+92px)] md:bottom-8" : "bottom-[calc(env(safe-area-inset-bottom)+24px)] sm:bottom-8"} focus-visible:outline-none`}
    >
      <span className="hidden md:block translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 transition-all duration-200 motion-reduce:transition-none rounded-full bg-[#111] text-white text-[12.5px] font-bold px-3.5 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">Chat with us</span>
      <span className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,.28)] transition-transform duration-200 group-hover:scale-110 group-active:scale-95 group-focus-visible:ring-4 group-focus-visible:ring-[#111]/40">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="relative w-7 h-7">
          <path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.2 8.8c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.6 1.4c.1.2 0 .4-.1.6l-.4.5c-.1.1-.2.3 0 .5.5.9 1.3 1.6 2.2 2.1.2.1.4.1.5-.1l.5-.6c.1-.2.4-.2.6-.1l1.4.7c.2.1.3.3.3.5 0 .8-.6 1.6-1.4 1.7-.9.1-2.3-.2-3.9-1.5-1.3-1.1-2.1-2.4-2.3-3.3-.2-.9 0-1.7.2-2.2z" fill="currentColor" />
        </svg>
      </span>
    </a>
  );
}
