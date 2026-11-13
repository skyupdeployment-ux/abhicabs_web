/** Default copy + config for /contact-us. Edit text here; the CMS can override hero / faq / cta. */
import { contactFormHref } from "../data/siteLinks";

// Lean default. "support" and "whatsapp" blocks still exist (re-enable via the CMS layout) but are off by default:
// the form already offers the same subjects and a floating WhatsApp button is on every page.
export const CONTACT_ORDER = ["info", "form", "business", "office", "hours", "faq"];

export const CONTACT = {
  hero: {
    image: "/images/airport-sunset-sedan.jpg",
    imageAlt: "An Abhi Cabs sedan on the road at sunset",
    title: "Let's Make Your",
    accent: "Journey Easier",
    description: "Have a question, need assistance with a booking, or want to explore our transportation services? We're here to help. Connect with the Abhi Cabs team and let us make your travel experience smoother.",
  },
  info: { eyebrow: "Contact", title: "Get in Touch with Abhi Cabs", description: "We're always happy to hear from you. Choose the most convenient way to reach our team." },
  form: {
    eyebrow: "Message", title: "Send Us a Message",
    description: "Tell us how we can assist you. Share your enquiry and our team will get back to you through the available contact channels.",
    assurances: ["Your message goes straight to our support team", "Track its status anytime under Support Tickets", "For urgent trip help, call us — it's faster"],
  },
  support: {
    eyebrow: "Support", title: "We're Here to Help You",
    description: "From booking questions to travel assistance, our team is here to help you find the right information and resolve your concerns.",
    featured: { title: "Booking Assistance", subject: "Booking Assistance", description: "Get help with anything about your ride before or after you book.", points: ["New booking enquiries", "Booking confirmation", "Booking details", "Vehicle-related questions", "Booking modifications, where supported"] },
    options: [
      { icon: "route", title: "Trip Assistance", subject: "Trip-Related Support", points: ["Pickup information", "Driver-related assistance", "Trip questions & coordination"] },
      { icon: "lifebuoy", title: "General Support", subject: "General Enquiry", points: ["Service information", "Pricing questions", "Website help & feedback"] },
    ],
  },
  whatsapp: { title: "Connect with Us on WhatsApp", description: "Need a quick answer? Reach out to Abhi Cabs through WhatsApp for convenient communication and travel-related enquiries.", cta: "Chat with Us" },
  business: {
    eyebrow: "Business", title: "Let's Work Together", image: "/images/corporate.webp", imageAlt: "Business travellers heading to a pickup",
    description: "Looking for reliable transportation solutions for your business? Connect with Abhi Cabs to discuss corporate travel and potential business partnerships.",
    categories: [
      { icon: "briefcase", title: "Corporate Transportation", cta: "Corporate Enquiry", subject: "Corporate Enquiry", prefill: "", points: ["Employee transportation", "Corporate travel", "Business meetings", "Airport transportation", "Business travel requirements"] },
      { icon: "handshake", title: "Partnerships & Business Opportunities", cta: "Partnership Enquiry", subject: "Other", prefill: "Partnership enquiry: ", points: ["Business partnerships", "Transportation collaborations", "Fleet-related business opportunities", "Other commercial enquiries"] },
    ],
  },
  office: { eyebrow: "Location", title: "Visit Our Office", description: "Find our office location and connect with the Abhi Cabs team.", fallbackImage: "/images/mountain-road-full.jpg" },
  hours: { eyebrow: "Availability", title: "When Can You Reach Us?", description: "Check our customer support availability before getting in touch.", bookingNote: "Online cab booking on this website is also available at any time." },
  faqsHeading: { eyebrow: "FAQ", title: "Frequently Asked Questions", description: "Find answers to common questions about contacting and getting assistance from Abhi Cabs." },
  // `{address}` is filled in when an office address is configured
  faqs: [
    { q: "How can I contact Abhi Cabs?", a: "Call us, message us on WhatsApp, email us, or use the contact form on this page. All options are listed at the top of this page." },
    { q: "How can I get help with an existing booking?", a: "Open My Booking and look up your trip with your Booking ID, or send us a message here with the subject “Booking Assistance” and include your Booking ID." },
    { q: "How can I enquire about cab fares?", a: "Enter your trip in the booking form on the Home or Services page to see the fare for your route. For anything else, choose “Fare and Pricing Enquiry” in the contact form." },
    { q: "How can I enquire about corporate transportation?", a: "Use “Corporate Enquiry” in the Business section of this page. It opens the contact form with the subject already selected." },
    { q: "Where is the Abhi Cabs office located?", a: "{office}" },
  ],
  officeFaq: {
    withAddress: "Our office address is {address}. Use Get Directions to open it in Google Maps.",
    without: "We operate across Karnataka and Hyderabad. For pickup or visit details, call or message us and our team will help.",
  },
  cta: {
    line1: "Need a Ride?", line2: "Let's Get You Moving!", primaryLabel: "Book Now",
    description: "Whether you're planning a local trip, airport transfer, or outstation journey, Abhi Cabs is ready to help you get started.",
  },
  seo: {
    title: "Contact Abhi Cabs | Bookings, Travel Assistance & Enquiries",
    description: "Contact Abhi Cabs for cab booking help, airport transfers, outstation travel and corporate enquiries. Reach us by phone, email or WhatsApp.",
  },
};

export { contactFormHref };
