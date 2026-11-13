import React, { useRef, useState } from "react";
import { fmtINR } from "../data/mockData";
import { formatDate, formatTime } from "../lib/dateTime";
import { getInvoiceHtml } from "../api/services/bookings";
import { useToast } from "../hooks/useToast";

/**
 * One invoice view for all three GST cases, shown after a booking is placed.
 *
 *   1. Business  — GSTIN + company name  -> TAX INVOICE, bill-to company,
 *                  recipient GSTIN printed (for input tax credit).
 *   2. Personal  — GST, no GSTIN/company -> TAX INVOICE, bill-to the person,
 *                  no recipient GSTIN. A valid B2C tax invoice.
 *   3. No GST    — plain retail          -> RECEIPT / bill of supply.
 *
 * What is shown here is a provisional copy built from the booking. The exact,
 * itemised GST tax invoice (with the CGST/SGST split and the seller's GSTIN) is
 * generated on the backend when the trip is completed, and "Download official
 * GST invoice" fetches that same document. Before completion the backend has no
 * invoice yet, so that button honestly says so rather than inventing a split —
 * the provisional copy never shows a fabricated tax amount.
 */
export default function BookingInvoiceModal({ booking, onClose }) {
  const toast = useToast();
  const bodyRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const isTaxInvoice = Boolean(
    booking.gstInvoice ||
    booking.customerType === "corporate" ||
    String(booking.gstNumber || "").trim()
  );
  const hasCompany = Boolean(String(booking.companyName || "").trim());
  const hasGstin = Boolean(String(booking.gstNumber || "").trim());

  const total = Number(booking.fare ?? booking.finalFare ?? booking.estimatedFare ?? 0);
  const paid = Number(booking.amountPaid ?? 0);
  const balance = Number(booking.balanceDue ?? 0);

  const docTitle = isTaxInvoice ? "TAX INVOICE" : "RECEIPT";

  function printProvisional() {
    if (!bodyRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>${docTitle}</title><style>` +
        `body{font-family:Montserrat,Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:22px}` +
        `table{width:100%;border-collapse:collapse}td,th{padding:6px 8px;vertical-align:top}` +
        `@media print{body{padding:0}}` +
        `</style></head><body>${bodyRef.current.innerHTML}</body></html>`
    );
    w.document.close();
    setTimeout(() => { try { w.print(); } catch { /* noop */ } }, 300);
  }

  async function downloadOfficial() {
    const id = booking.id || booking.bookingId;
    if (!id) {
      toast("This booking has no reference yet. Please try again in a moment.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await getInvoiceHtml(id);
      const html = res?.html;
      if (!html) throw new Error("NO_INVOICE");
      const w = window.open("", "_blank");
      if (!w) { toast("Allow pop-ups to download the invoice.", "error"); return; }
      w.document.write(html);
      w.document.close();
      setTimeout(() => { try { w.print(); } catch { /* noop */ } }, 400);
    } catch (err) {
      const code = String(err?.code || err?.message || "");
      if (/NO_INVOICE|not found|404/i.test(code)) {
        toast("Your official GST invoice will be available to download here once the trip is completed.", "info");
      } else if (/401|unauth|forbidden|403/i.test(code)) {
        toast("Sign in with the number you booked with to download the official invoice.", "info");
      } else {
        toast("Couldn't fetch the invoice right now. Please try again.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  const cell = { padding: "7px 10px", fontSize: 12.5 };
  const label = { ...cell, color: "#666", width: 110 };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 640, margin: "24px 0", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #EFEFEF" }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{docTitle}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={printProvisional}
              style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #111", background: "#fff", color: "#111", cursor: "pointer" }}
            >
              Print
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F1F1", color: "#555", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >×</button>
          </div>
        </div>

        {/* Invoice body */}
        <div style={{ maxHeight: "70vh", overflowY: "auto", padding: 22 }} ref={bodyRef}>
          {/* Brand bar */}
          <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: ".04em" }}>
                ABHI<span style={{ color: "#FFC107" }}> CABS</span>
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>CAR RENTALS</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10.5, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
              <div>#45, 2nd Floor, MG Road, Bangalore – 560 001</div>
              <div>Karnataka, India</div>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "10px 0", borderLeft: "1px solid #DDD", borderRight: "1px solid #DDD" }}>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#444" }}>
              {isTaxInvoice ? "Tax Invoice" : "Receipt"}
            </span>
          </div>

          {/* Customer + invoice meta */}
          <table style={{ border: "1px solid #DDD", borderBottom: "none" }}>
            <tbody>
              <tr>
                <td style={label}>Name</td>
                <td style={{ ...cell, fontWeight: 600 }}>{booking.passengerName || "—"}</td>
                <td style={{ ...label, borderLeft: "1px solid #DDD" }}>Booking ID</td>
                <td style={{ ...cell, fontWeight: 600, fontFamily: "monospace" }}>{booking.bookingId || "—"}</td>
              </tr>
              {hasCompany && (
                <tr>
                  <td style={label}>Company</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{booking.companyName}</td>
                  <td style={{ ...label, borderLeft: "1px solid #DDD" }}>Billed On</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{formatDate(new Date())}</td>
                </tr>
              )}
              {hasGstin && (
                <tr>
                  <td style={label}>GSTIN</td>
                  <td style={{ ...cell, fontWeight: 600, fontFamily: "monospace" }}>{booking.gstNumber}</td>
                  <td style={{ ...label, borderLeft: "1px solid #DDD" }}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                </tr>
              )}
              <tr>
                <td style={label}>Mobile</td>
                <td style={cell}>{booking.mobile || "—"}</td>
                <td style={{ ...label, borderLeft: "1px solid #DDD" }}>Email</td>
                <td style={cell}>{booking.email || "—"}</td>
              </tr>
            </tbody>
          </table>

          {/* Trip + amount */}
          <table style={{ border: "1px solid #DDD" }}>
            <tbody>
              <tr><td style={label}>Trip</td><td style={cell} colSpan={3}>{(booking.tripType || "").replace(/-/g, " ") || "—"}</td></tr>
              <tr><td style={label}>From</td><td style={cell} colSpan={3}>{booking.pickup || "—"}</td></tr>
              <tr><td style={label}>To</td><td style={cell} colSpan={3}>{booking.drop || "—"}</td></tr>
              <tr>
                <td style={label}>Date / Time</td>
                <td style={cell} colSpan={3}>
                  {booking.date ? formatDate(booking.date) : "—"} {booking.time ? formatTime(booking.time) : ""}
                </td>
              </tr>
              <tr><td style={label}>Vehicle</td><td style={cell} colSpan={3}>{booking.vehicle || "—"}</td></tr>
              <tr style={{ borderTop: "1px solid #DDD" }}>
                <td style={{ ...cell, fontWeight: 700 }}>Total{isTaxInvoice ? " (incl. GST)" : ""}</td>
                <td style={{ ...cell, fontWeight: 800, textAlign: "right" }} colSpan={3}>{fmtINR(total)}</td>
              </tr>
              {paid > 0 && (
                <tr><td style={cell}>Paid</td><td style={{ ...cell, textAlign: "right" }} colSpan={3}>{fmtINR(paid)}</td></tr>
              )}
              {balance > 0 && (
                <tr><td style={cell}>Balance due (on trip)</td><td style={{ ...cell, textAlign: "right", fontWeight: 600 }} colSpan={3}>{fmtINR(balance)}</td></tr>
              )}
            </tbody>
          </table>

          {isTaxInvoice ? (
            <p style={{ fontSize: 11, color: "#666", marginTop: 12, lineHeight: 1.6 }}>
              This amount is inclusive of GST (SAC 996412). Your itemised GST tax invoice — with the CGST/SGST breakup and our GSTIN — can be downloaded below once the trip is completed.
            </p>
          ) : (
            <p style={{ fontSize: 11, color: "#666", marginTop: 12, lineHeight: 1.6 }}>
              This is a receipt (bill of supply). To get a GST tax invoice on future trips, choose “+ GST” at checkout.
            </p>
          )}
          <p style={{ fontSize: 10.5, color: "#999", marginTop: 6 }}>
            Electronically generated. Toll, parking and state taxes are charged as per actuals. For queries: support@abhicabs.in
          </p>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 10, padding: "14px 22px", borderTop: "1px solid #EFEFEF", background: "#FAFAFA" }}>
          <button
            onClick={downloadOfficial}
            disabled={busy}
            style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "#111", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Fetching…" : isTaxInvoice ? "Download official GST invoice" : "Download official receipt"}
          </button>
          <button
            onClick={onClose}
            style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 11, border: "1.5px solid #E5E5E5", background: "#fff", color: "#111", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
