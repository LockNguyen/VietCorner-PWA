import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppTabs from "@/components/AppTabs";
import BannerHost from "@/components/BannerHost";
import AdoptDeviceLanguage from "@/features/i18n/components/AdoptDeviceLanguage"; // I18N
import LanguageProvider from "@/features/i18n/components/LanguageProvider"; // I18N
import { getLanguage } from "@/features/i18n/server/queries"; // I18N
import { DEFAULT_LANGUAGE } from "@/features/i18n/types"; // I18N
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import NameStep from "@/features/profiles/components/NameStep"; // PROFILES
import { getMyProfile } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";
import { BannerProvider } from "@/lib/useBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Góc Việt",
  // iOS reads these instead of manifest.ts when the app is added to the Home Screen.
  // "black-translucent" lets the blue top bar run up behind the status bar, with white clock and battery.
  appleWebApp: { capable: true, title: "Góc Việt", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1976d2", // the `action` token: the top bar's blue
  viewportFit: "cover", // lets content use the full screen on notched phones
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // I18N: one read per page load. Null means signed out, or signed in without a choice yet.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const storedLanguage = user ? await getLanguage(supabase) : null;
  // PERMISSIONS: read once per page load, from the login token. Anyone who may manage something gets the tab.
  const permissions = user ? await getMyPermissions(supabase) : [];
  // PROFILES: someone who has not given their name yet is asked before they see anything else.
  const profile = user ? await getMyProfile(supabase, user.id) : null;
  const askName = profile !== null && !profile.named;

  return (
    <html lang={storedLanguage ?? DEFAULT_LANGUAGE}>
      <body className="bg-surface text-ink">
        <LanguageProvider language={storedLanguage ?? DEFAULT_LANGUAGE} signedIn={Boolean(user)}>
          <BannerProvider>
            <main className="mx-auto max-w-column pb-24">{askName ? <NameStep /> : children}</main>
            <BannerHost />
          </BannerProvider>
          {user && !askName && <AppTabs showAdmin={permissions.length > 0} />}
          {user && <AdoptDeviceLanguage storedLanguage={storedLanguage} />}
        </LanguageProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
