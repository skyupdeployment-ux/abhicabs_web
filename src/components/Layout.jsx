import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store, rehydrateStore } from "../store/store";
import Header from "./Header";
import Footer from "./Footer";
import ToastStack from "./ToastStack";
import LoginPopup from "./LoginPopup";
import WhatsAppFloat from "./WhatsAppFloat";
import BookingWidget from "./BookingWidget";
import { usePageContext } from "vike-react/usePageContext";
import { PagesContext } from "../hooks/usePageContent";
import "../styles/global.css";

/* Pages where the global booking strip should NOT appear */
const HIDE_BOOKING_ON = ["/about", "/contact", "/contact-us"];

function GlobalBookingStrip() {
  const { urlPathname } = usePageContext();
  const path = (urlPathname || "/").replace(/\/+$/, "") || "/";

  const hide = HIDE_BOOKING_ON.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  if (hide) return null;

  /* Don't double-render on pages that already embed their own widget */
  const pageAlreadyHasWidget =
    path === "/" ||
    path.startsWith("/booking") ||
    path.startsWith("/checkout") ||
    path.startsWith("/confirmation") ||
    path.startsWith("/payment") ||
    path.startsWith("/cab-details") ||
    path.startsWith("/tracking") ||
    path.startsWith("/my-booking") ||
    path.startsWith("/login") ||
    path.startsWith("/delete-account") ||
    path.startsWith("/support-tickets") ||
    path.startsWith("/admin") ||
    path.startsWith("/offers") ||
    path.startsWith("/outstation") ||
    (path.startsWith("/services/") && path !== "/services");

  if (pageAlreadyHasWidget) return null;

  return (
    <div
      id="booking"
      style={{
        width: "100%",
        maxWidth: 1120,
        margin: "-48px auto 0",
        position: "relative",
        zIndex: 20,
        padding: "0 16px",
        scrollMarginTop: 96,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <BookingWidget initialMode="one-way" />
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const serverPages = usePageContext().data?.allPages ?? null;
  useEffect(() => {
    rehydrateStore();
  }, []);

  return (
    <Provider store={store}>
     <PagesContext.Provider value={serverPages}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
          <GlobalBookingStrip />
        </main>
        <Footer />
      </div>
      <ToastStack />
      <LoginPopup />
      <WhatsAppFloat />
     </PagesContext.Provider>
    </Provider>
  );
}
