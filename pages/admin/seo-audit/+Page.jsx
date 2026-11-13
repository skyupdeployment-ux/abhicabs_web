import { AuthProvider } from "../../../src/context/BlogAuthContext";
import SeoAuditApp from "../../../src/pages/SeoAudit";

export default function Page() {
  return (
    <>
      {/* Hide the main site Header/Footer chrome, same as the CMS route */}
      <style>{`
        body > div > div > header,
        body > div > div > footer,
        nav.fixed,
        [class*="TopBar"],
        [class*="topbar"],
        .min-h-screen.flex.flex-col > :first-child,
        .min-h-screen.flex.flex-col > :last-child {
          display: none !important;
        }
        .min-h-screen.flex.flex-col > main { flex: 1; }
        main.flex-1 { padding: 0 !important; margin: 0 !important; }
      `}</style>
      <AuthProvider>
        <SeoAuditApp />
      </AuthProvider>
    </>
  );
}
