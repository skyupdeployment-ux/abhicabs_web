import React, { useEffect, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useConfig } from "vike-react/useConfig";
import { Head } from "vike-react/Head";
import CTASection from "../../src/components/CTASection";
import SectionRenderer from "../../src/components/SectionRenderer";
import useBusinessInfo from "../../src/hooks/useBusinessInfo";
import useCmsContent from "../../src/hooks/useCmsContent";
import { CONTACT, CONTACT_ORDER } from "../../src/content/contact";
import { SUBJECTS } from "../../src/data/businessInfo";
import { ROUTES } from "../../src/data/siteLinks";
import ContactHero from "../../src/components/contact/ContactHero";
import ContactInformation from "../../src/components/contact/ContactInformation";
import ContactForm from "../../src/components/contact/ContactForm";
import CustomerSupport from "../../src/components/contact/CustomerSupport";
import WhatsAppSupport from "../../src/components/contact/WhatsAppSupport";
import BusinessEnquiries from "../../src/components/contact/BusinessEnquiries";
import OfficeLocation from "../../src/components/contact/OfficeLocation";
import WorkingHours from "../../src/components/contact/WorkingHours";
import ContactFAQs from "../../src/components/contact/ContactFAQs";
import { scrollToId } from "../../src/components/contact/shared";

const SITE = "https://www.abhicabs24x7.com";

// ?subject=corporate (used by service pages) -> form subject
const SUBJECT_PARAM = {
  booking: "Booking Assistance", general: "General Enquiry", fare: "Fare and Pricing Enquiry", pricing: "Fare and Pricing Enquiry",
  trip: "Trip-Related Support", feedback: "Feedback", complaint: "Complaint", corporate: "Corporate Enquiry", partnership: "Other", other: "Other",
};

export default function Page() {
  const { content, order, extraSections } = useCmsContent("contact", CONTACT, CONTACT_ORDER);
  const config = useConfig();
  config({ title: content.seo.title, description: content.seo.description, image: `${SITE}${content.hero.image}` });
  const ctx = usePageContext();
  const info = useBusinessInfo();

  const [subject, setSubject] = useState("Booking Assistance");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const p = ctx.urlParsed?.search?.subject;
    const mapped = SUBJECT_PARAM[String(p || "").toLowerCase()] || (SUBJECTS.includes(p) ? p : null);
    if (mapped) setSubject(mapped);
    if (typeof window !== "undefined" && window.location.hash === "#contact-form") setTimeout(() => scrollToId("contact-form"), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Support / Business buttons: preselect the subject, keep anything already typed.
  const pickSubject = (s, prefill = "") => {
    setSubject(s);
    if (prefill) setMessage((m) => (m.trim() ? m : prefill));
    scrollToId("contact-form");
  };
  const book = () => { if (typeof window !== "undefined") window.location.href = ROUTES.booking; };

  // Built-in blocks. Order + visibility come from the CMS layout (default: CONTACT_ORDER).
  const blocks = {
    info: <ContactInformation info={info} content={content} />,
    form: <ContactForm content={content} subject={subject} onSubjectChange={setSubject} message={message} onMessageChange={setMessage} />,
    support: <CustomerSupport content={content} onPick={pickSubject} />,
    whatsapp: <WhatsAppSupport content={content} href={info.whatsappHref} />,
    business: <BusinessEnquiries content={content} onPick={pickSubject} />,
    office: <OfficeLocation info={info} content={content} />,
    hours: <WorkingHours content={content} />,
    faq: <ContactFAQs content={content} info={info} />,
  };
  const shown = order.filter(({ key, hidden }) => !hidden && blocks[key]);

  return (
    <div>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ContactPage", name: content.seo.title, url: `${SITE}/contact-us`, description: content.seo.description }) }} />
      </Head>

      <ContactHero content={content} onBook={book} />
      {shown.map(({ key }) => <React.Fragment key={key}>{blocks[key]}</React.Fragment>)}
      {extraSections.length > 0 && <SectionRenderer sections={extraSections} />}

      {/* Final CTA — the exact Home CTASection, content only changed */}
      <CTASection id="contact-cta" onBookMode={book} {...content.cta} secondary={false} />

    </div>
  );
}
