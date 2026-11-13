import EmojiIcon from "./ui/EmojiIcon";
import { useEffect, useState } from "react";
import { OPEN_LOGIN } from "../lib/authEvents";
import { IconClose } from "./Icons";

const STORAGE_KEY = "abhicabs_login_popup_dismissed";

export default function LoginPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_LOGIN, onOpen);
    return () => window.removeEventListener(OPEN_LOGIN, onOpen);
  }, []);

  const close = () => {
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  if (!visible) return null;

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(380px, calc(100vw - 32px))", background: "#fff", borderRadius: 20,
        boxShadow: "0 16px 48px rgba(0,0,0,0.15)", zIndex: 9999, padding: "28px 24px",
      }}>
        <button onClick={close} style={{
          position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%",
          border: "none", background: "#F3F4F6", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: "#6B7280",
        }}>
          <IconClose size={15} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>Need Help?</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Call us anytime — we're available 24×7</div>
        </div>

        <a href="tel:+918096000182" style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          borderRadius: 12, border: "1px solid #E5E7EB", textDecoration: "none", marginBottom: 8,
        }}>
          <EmojiIcon glyph="📞" size={20} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>+91 80960 00182</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Booking support</div>
          </div>
        </a>

        <a href="tel:+918096000183" style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          borderRadius: 12, border: "1px solid #E5E7EB", textDecoration: "none", marginBottom: 8,
        }}>
          <EmojiIcon glyph="📞" size={20} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>+91 80960 00183</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>General enquiries</div>
          </div>
        </a>

        <a href="https://wa.me/918096000183?text=Hi%2C%20I%20need%20help%20booking%20a%20cab" target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          borderRadius: 12, border: "1px solid #E5E7EB", textDecoration: "none", marginBottom: 16,
        }}>
          <EmojiIcon glyph="💬" size={20} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>WhatsApp</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Chat with us</div>
          </div>
        </a>

        <a href="/#booking" onClick={close} style={{
          display: "block", textAlign: "center", padding: "12px", borderRadius: 12,
          background: "#F5A623", color: "#000", fontSize: 14, fontWeight: 700, textDecoration: "none",
        }}>
          Book Without Login
        </a>
      </div>
    </>
  );
}
