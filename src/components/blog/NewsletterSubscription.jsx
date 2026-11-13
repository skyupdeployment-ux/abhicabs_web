import React, { useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { subscribeToNewsletter, isNewsletterConfigured } from "../../api/services/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSubscription() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState({ state: "idle" });
  const busy = useRef(false);
  const emailErr = touched && !EMAIL_RE.test(email.trim()) ? (email.trim() ? "Enter a valid email address." : "Email address is required.") : "";

  async function submit(e) {
    e.preventDefault();
    if (busy.current) return; // no duplicate submissions
    setTouched(true);
    if (!EMAIL_RE.test(email.trim())) { document.getElementById("nl-email")?.focus(); return; }
    busy.current = true; setStatus({ state: "loading" });
    try {
      await subscribeToNewsletter({ name: name.trim(), email: email.trim() });
      setStatus({ state: "success" }); setName(""); setEmail(""); setTouched(false);
    } catch (err) {
      setStatus({ state: "error", text: err.message });
    } finally { busy.current = false; }
  }

  return (
    <section id="newsletter" aria-labelledby="newsletter-title" className="relative overflow-hidden bg-[#111] scroll-mt-28">
      <img src="/images/tea-garden-road.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/85 to-[#111]/40" />
      <div className="relative max-w-[1264px] mx-auto px-5 sm:px-6 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex w-12 h-12 rounded-xl bg-primary text-[#111] items-center justify-center"><Mail size={22} aria-hidden /></span>
          <h2 id="newsletter-title" className="mt-5 text-white text-[28px] md:text-[40px] font-black tracking-tight leading-tight">Get Travel Inspiration <span className="text-primary">in Your Inbox</span></h2>
          <p className="mt-3 text-white/70 text-[16px] leading-relaxed max-w-[460px]">Subscribe to receive travel guides, destination inspiration, road-trip ideas, and the latest updates from Abhi Cabs.</p>
        </div>
        {status.state === "success" ? (
          <div role="status" className="rounded-[10px] bg-white/10 border border-white/15 p-8 text-white flex gap-3 items-start">
            <CheckCircle2 className="text-primary shrink-0 mt-0.5" aria-hidden /><div><p className="font-extrabold text-[18px]">You&rsquo;re subscribed</p><p className="text-white/70 text-[14.5px] mt-1">Thanks — look out for our next travel story.</p></div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate aria-busy={status.state === "loading"} className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label htmlFor="nl-name" className="block text-[13px] font-bold text-white/80 mb-1.5">Name <span className="text-white/50 font-medium">(optional)</span></label>
                <input id="nl-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full h-12 rounded-[10px] px-4 bg-white outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label htmlFor="nl-email" className="block text-[13px] font-bold text-white/80 mb-1.5">Email address <span aria-hidden className="text-primary">*</span></label>
                <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} autoComplete="email" aria-invalid={!!emailErr} aria-describedby={emailErr ? "nl-email-err" : undefined} className="w-full h-12 rounded-[10px] px-4 bg-white outline-none focus:ring-2 focus:ring-primary" />
                {emailErr && <p id="nl-email-err" role="alert" className="mt-1.5 text-[12.5px] text-[#FCA5A5]">{emailErr}</p>}</div>
            </div>
            <button type="submit" disabled={status.state === "loading" || !isNewsletterConfigured} className="h-14 rounded-full bg-primary text-[#111] font-bold text-[16px] inline-flex items-center justify-center gap-2 hover:bg-[#E6AC00] transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {status.state === "loading" ? <><Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden /> Subscribing…</> : isNewsletterConfigured ? "Subscribe Now" : "Subscriptions opening soon"}
            </button>
            <div aria-live="polite">
              {!isNewsletterConfigured && <p className="text-white/60 text-[13px]">Email subscriptions aren&rsquo;t open yet. In the meantime, new stories appear right here in the journal.</p>}
              {status.state === "error" && <p role="alert" className="flex gap-2 items-start text-[13.5px] text-[#FCA5A5]"><AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />{status.text}</p>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
