// ─────────────────────────────────────────────────────────────────────────────
// Customer self-service: GST billing
// ─────────────────────────────────────────────────────────────────────────────
// GST on a fare is decided by the backend from the signed-in customer's
// ACCOUNT TYPE (gst_config taxes CORPORATE accounts only). Typing a GSTIN into
// the checkout form does nothing by itself — the account has to be switched,
// which is exactly what POST /customers/me/gstin does. After that, any new
// quote for this user carries the GST lines.
// ─────────────────────────────────────────────────────────────────────────────
import { api } from "../client";

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(v) {
  return GSTIN_REGEX.test(String(v || "").trim().toUpperCase());
}

/** Switch the signed-in customer to GST billing (with a company GSTIN). */
export async function addGstin({ gstin, companyName }) {
  const body = { gstin: String(gstin).trim().toUpperCase() };
  const name = String(companyName || "").trim();
  if (name.length >= 2) body.companyName = name;
  return api.post("/customers/me/gstin", body);
}

/**
 * Switch the signed-in customer to GST billing WITHOUT a company GSTIN.
 *
 * This is the B2C tax-invoice case: the customer wants GST added to the fare
 * and a tax invoice issued, but has no company GSTIN to claim input tax credit
 * against. The same endpoint is used as addGstin, but with `gstInvoice: true`
 * and no `gstin`, so the backend can tell the two apart and switch the account
 * to GST billing with an empty GSTIN on file.
 *
 * BACKEND CONTRACT: POST /customers/me/gstin must accept `{ gstInvoice: true }`
 * (no `gstin`) and mark the account GST-billed so the next /fares quote carries
 * the tax lines. Until that is in place this call will be rejected, and the
 * checkout surfaces the error instead of pretending GST was applied.
 */
export async function enableGstInvoice() {
  return api.post("/customers/me/gstin", { gstInvoice: true });
}

/** Back to personal (non-GST) billing. */
export async function removeGstin() {
  return api.del("/customers/me/gstin");
}

/** { accountType, corporateStatus, ... } for the signed-in customer. */
export async function getAccountType() {
  return api.get("/customers/me/account");
}
