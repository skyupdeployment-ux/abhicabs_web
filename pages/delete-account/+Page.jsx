import React, { useState } from "react";
import { normalisePhone, requestOtp, verifyOtp } from "../../src/api/services/auth";
import { api } from "../../src/api/client";
import { clearTokens, clearStoredUserName, getAccessToken } from "../../src/api/tokens";

const STEP = { PHONE: "PHONE", OTP: "OTP", CONFIRM: "CONFIRM", DONE: "DONE" };

export default function Page() {
  const [step, setStep]         = useState(STEP.PHONE);
  const [phone, setPhone]       = useState("");
  const [otp, setOtp]           = useState("");
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [otpSent, setOtpSent]   = useState(false);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    const mobile = normalisePhone(phone);
    if (mobile.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setLoading(true);
    try {
      await requestOtp(mobile);
      setOtpSent(true);
      setStep(STEP.OTP);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (!otp.trim()) { setError("Enter the OTP sent to your number."); return; }
    setLoading(true);
    try {
      await verifyOtp(normalisePhone(phone), otp.trim());
      setStep(STEP.CONFIRM);
    } catch (err) {
      setError(err.message || "Incorrect OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.delete("/customers/me", { data: { reason: reason.trim() || undefined } });
      clearTokens();
      clearStoredUserName();
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.message || "Could not process your request. Please contact support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "36px 32px", width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <a href="/">
            <img src="/logo.png" alt="AbhiCabs" style={{ height: 36 }} onError={(e) => { e.target.style.display = "none"; }} />
          </a>
        </div>

        {step === STEP.DONE ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>Account deleted</h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
              Your account and personal data have been scheduled for deletion. This is usually completed within 30 days. You will no longer be able to log in with this number.
            </p>
            <a href="/" style={{ display: "inline-block", padding: "10px 24px", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Back to home
            </a>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "#111" }}>Delete your account</h1>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently delete your AbhiCabs account and all associated data including booking history, saved details, and personal information. This action cannot be undone.
            </p>

            {/* Step indicators */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {[STEP.PHONE, STEP.OTP, STEP.CONFIRM].map((s, i) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 4, background: [STEP.PHONE, STEP.OTP, STEP.CONFIRM].indexOf(step) >= i ? "#2563eb" : "#e5e7eb", transition: "background 0.2s" }} />
              ))}
            </div>

            {/* ── Step 1: Phone ── */}
            {step === STEP.PHONE && (
              <form onSubmit={handleRequestOtp}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                  Mobile number linked to your account
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <span style={{ display: "flex", alignItems: "center", padding: "0 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", whiteSpace: "nowrap" }}>
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                    style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }}
                  />
                </div>
                {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === STEP.OTP && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>
                  OTP sent to +91 {normalisePhone(phone)}. <button type="button" onClick={() => { setStep(STEP.PHONE); setError(""); }} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Change</button>
                </p>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box" }}
                />
                {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
              </form>
            )}

            {/* ── Step 3: Confirm deletion ── */}
            {step === STEP.CONFIRM && (
              <form onSubmit={handleDelete}>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 18 }}>
                  <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 600, marginBottom: 4 }}>This action is irreversible</p>
                  <p style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
                    Deleting your account will remove all personal data, booking history, and active sessions. Any upcoming bookings should be cancelled separately.
                  </p>
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                  Reason for deletion <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Let us know why you're leaving…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 16, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
                {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Deleting account…" : "Yes, permanently delete my account"}
                </button>
                <button type="button" onClick={() => window.history.back()} style={{ width: "100%", marginTop: 10, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer note */}
        {step !== STEP.DONE && (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
            Having trouble? Email us at <a href="mailto:support@abhicabs.in" style={{ color: "#2563eb" }}>support@abhicabs.in</a>
          </p>
        )}
      </div>
    </div>
  );
}