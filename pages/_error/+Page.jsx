import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useConfig } from "vike-react/useConfig";
import { Head } from "vike-react/Head";

export default function ErrorPage() {
  const { is404 } = usePageContext();
  useConfig()({ title: is404 ? "Page not found | Abhi Cabs" : "Something went wrong | Abhi Cabs", description: "The page you were looking for could not be found. Browse Abhi Cabs services or book a cab from the home page." });
  return (<>
    <Head><meta name="robots" content="noindex, follow" /></Head>
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 22px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{is404 ? "🗺️" : "⚠️"}</div>
      <h1 style={{ fontWeight: 800, fontSize: 28, margin: "0 0 10px" }}>
        {is404 ? "Page Not Found" : "Something went wrong"}
      </h1>
      <p style={{ fontSize: 15, color: "#666", margin: "0 0 28px", maxWidth: 420 }}>
        {is404
          ? "The page you're looking for doesn't exist or has been moved."
          : "An unexpected error occurred. Please refresh and try again."}
      </p>
      <a
        href="/"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 9999, background: "#FFD54F", color: "#111", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
      >
        ← Back to Home
      </a>
    </div>
  </>);
}
