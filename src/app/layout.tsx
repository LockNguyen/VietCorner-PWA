import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import AdoptDeviceLanguage from "@/features/i18n/components/AdoptDeviceLanguage"; // I18N
import LanguageProvider from "@/features/i18n/components/LanguageProvider"; // I18N
import { getLanguage } from "@/features/i18n/server/queries"; // I18N
import { DEFAULT_LANGUAGE } from "@/features/i18n/types"; // I18N
import { createClient } from "@/lib/supabase/server";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "VietCorner",
  // iOS reads these instead of manifest.ts when the app is added to the Home Screen.
  appleWebApp: { capable: true, title: "VietCorner", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#2196f3",
  viewportFit: "cover", // lets content use the full screen on notched phones
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // I18N: one read per page load. Null means signed out, or signed in without a choice yet.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const storedLanguage = user ? await getLanguage(supabase) : null;

  return (
    <html lang={storedLanguage ?? DEFAULT_LANGUAGE}>
      <body className="bg-white text-gray-900">
        <LanguageProvider language={storedLanguage ?? DEFAULT_LANGUAGE} signedIn={Boolean(user)}>
          <main className="pb-20">{children}</main>
          <TabBar />
          {user && <AdoptDeviceLanguage storedLanguage={storedLanguage} />}
        </LanguageProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
