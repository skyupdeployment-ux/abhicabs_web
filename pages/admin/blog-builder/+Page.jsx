import { AuthProvider } from "../../../src/context/BlogAuthContext";
import AbhiCabsCMS from "../../../src/pages/BlogBuilder";

export default function Page() {
  return (
    <>
      {/* Hide the main site Header, Footer, and other chrome */}
      <style>{`
        body > div > div > header,
        body > div > div > footer,
        body > div > div > .min-h-screen > header,
        body > div > div > .min-h-screen > footer,
        nav.fixed,
        [class*="TopBar"],
        [class*="topbar"],
        .flex.flex-col > header,
        .flex.flex-col > footer,
        .min-h-screen.flex.flex-col > :first-child,
        .min-h-screen.flex.flex-col > :last-child {
          display: none !important;
        }
        .min-h-screen.flex.flex-col > main {
          flex: 1;
        }
        main.flex-1 {
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>
      <AuthProvider>
        <AbhiCabsCMS />
      </AuthProvider>
    </>
  );
}
