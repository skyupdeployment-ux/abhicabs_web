/**
 * Newsletter subscription.
 *
 * The backend has NO newsletter endpoint yet (checked: only contact, bookings, auth,
 * payments, blog CMS). This is wired and ready: set VITE_NEWSLETTER_ENDPOINT to a URL that
 * accepts POST { name, email } and answers 2xx on success (e.g. a Mailchimp/Brevo proxy
 * or a new backend route). Until then `isNewsletterConfigured` is false and the UI says so
 * honestly — it NEVER shows a fake "subscribed" message.
 */
export const NEWSLETTER_ENDPOINT = (import.meta.env.VITE_NEWSLETTER_ENDPOINT || "").trim();
export const isNewsletterConfigured = !!NEWSLETTER_ENDPOINT;

export async function subscribeToNewsletter({ name, email }) {
  if (!isNewsletterConfigured) throw Object.assign(new Error("Newsletter isn't connected yet."), { code: "NOT_CONFIGURED" });
  let res;
  try {
    res = await fetch(NEWSLETTER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
  } catch {
    throw Object.assign(new Error("We couldn't reach the server. Check your connection and try again."), { code: "NETWORK_ERROR" });
  }
  if (res.status === 409) throw Object.assign(new Error("This email is already subscribed."), { code: "DUPLICATE" });
  if (!res.ok) throw Object.assign(new Error("Something went wrong. Please try again in a moment."), { code: "SERVER" });
  return true;
}
