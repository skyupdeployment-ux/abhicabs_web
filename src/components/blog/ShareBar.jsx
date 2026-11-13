import React, { useState } from "react";
import { Link as LinkIcon, Check, MessageCircle } from "lucide-react";

const Fb = <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />;
const In = <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>;
const Svg = ({ children }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>;

/** Real share links for the real article URL. `vertical` for the desktop side rail. */
export default function ShareBar({ url, title, vertical = false }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const btn = "w-11 h-11 rounded-full border border-border bg-white flex items-center justify-center text-text-secondary hover:bg-primary hover:text-[#111] hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6AC00]";
  async function copy() {
    try { await navigator.clipboard.writeText(url); }
    catch { const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); document.execCommand("copy"); i.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-row flex-wrap"} items-center gap-2.5`} role="group" aria-label="Share this article">
      <span className={`text-[12px] font-black uppercase tracking-[0.14em] text-text-secondary ${vertical ? "[writing-mode:vertical-rl] rotate-180 mb-1" : "mr-1"}`}>Share</span>
      <a className={btn} href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={18} aria-hidden /></a>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Svg>{Fb}</Svg></a>
      <a className={btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Svg>{In}</Svg></a>
      <button type="button" className={btn} onClick={copy} aria-label={copied ? "Link copied" : "Copy article link"}>{copied ? <Check size={18} aria-hidden /> : <LinkIcon size={18} aria-hidden />}</button>
      <span role="status" className="sr-only">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}
