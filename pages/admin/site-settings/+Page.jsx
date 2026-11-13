import { AuthProvider } from "../../../src/context/BlogAuthContext";
import SiteSettingsApp from "../../../src/pages/SiteSettings";

export default function Page() {
  return (
    <>
      <style>{`
        body > div > div > header,
        body > div > div > footer,
        nav.fixed,
        [class*="TopBar"],
        [class*="topbar"] { display: none !important; }
      `}</style>
      <AuthProvider>
        <SiteSettingsApp />
      </AuthProvider>
    </>
  );
}
