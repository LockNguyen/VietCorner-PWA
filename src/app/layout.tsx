import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import AppTabs from "@/components/AppTabs";
import BannerHost from "@/components/BannerHost";
import WaitingStep from "@/features/approval/components/WaitingStep"; // APPROVAL
import SignOutButton from "@/features/auth/components/SignOutButton"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import AdoptDeviceLanguage from "@/features/i18n/components/AdoptDeviceLanguage"; // I18N
import LanguageProvider from "@/features/i18n/components/LanguageProvider"; // I18N
import { getLanguage } from "@/features/i18n/server/queries"; // I18N
import { DEFAULT_LANGUAGE } from "@/features/i18n/types"; // I18N
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { managesSomething, USE_THE_APP } from "@/features/permissions/types"; // PERMISSIONS
import NameStep from "@/features/profiles/components/NameStep"; // PROFILES
import { getMyProfile } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";
import KeepSubscribed from "@/features/push/components/KeepSubscribed"; // PUSH
import InstallGate from "@/features/install/components/InstallGate"; // INSTALL
import NotificationStep from "@/features/push/components/NotificationStep"; // PUSH
import { NOTIFICATIONS_ASKED_COOKIE } from "@/features/push/types"; // PUSH
import { BannerProvider } from "@/lib/useBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { APP_NAME } from "@/lib/appName";

export const metadata: Metadata = {
  title: APP_NAME,
  // iOS reads these instead of manifest.ts when the app is added to the Home Screen.
  // "black-translucent" lets the blue top bar run up behind the status bar, with white clock and battery.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1976d2", // the `action` token: the top bar's blue
  viewportFit: "cover", // lets content use the full screen on notched phones
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A null language means signed out, or signed in without a choice yet.
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  // Read together, once per page load:
  // I18N the stored language · PERMISSIONS who may manage something gets the Admin tab · PROFILES the name.
  const [storedLanguage, permissions, profile] = user
    ? await Promise.all([getLanguage(supabase), getMyPermissions(supabase), getMyProfile(supabase, user.id)])
    : [null, [], null];
  // PROFILES: someone who has not given their name yet is asked before they see anything else.
  const askName = profile !== null && !profile.named;
  // APPROVAL: someone no admin has let in yet waits. The database shows them nothing either way.
  const notLetIn = Boolean(user) && !askName && !permissions.includes(USE_THE_APP);
  // PUSH: a new member is first asked for notifications, once per device (a cookie). Members who simply
  // sign in again are not asked; the switch in Settings is theirs.
  const askNotifications = notLetIn && !(await cookies()).has(NOTIFICATIONS_ASKED_COOKIE);
  const waiting = notLetIn && !askNotifications;
  const step = askName ? <NameStep /> : askNotifications ? <NotificationStep /> : waiting ? <WaitingStep /> : null;

  return (
    <html lang={storedLanguage ?? DEFAULT_LANGUAGE}>
      <body className="bg-surface text-ink">
        <LanguageProvider language={storedLanguage ?? DEFAULT_LANGUAGE} signedIn={Boolean(user)}>
          <BannerProvider>
            <main className="mx-auto max-w-column pb-24">
              {/* INSTALL: signed in on a phone's browser, the install guide comes first (InstallGate). */}
              {user ? (
                <InstallGate step={notLetIn ? "install" : undefined} footer={<SignOutButton variant="text" />}>
                  {step ?? children}
                </InstallGate>
              ) : (
                (step ?? children)
              )}
            </main>
            <BannerHost />
          </BannerProvider>
          {user && !step && <AppTabs showAdmin={managesSomething(permissions)} />}
          {user && <AdoptDeviceLanguage storedLanguage={storedLanguage} />}
          {user && <KeepSubscribed />} {/* PUSH */}
        </LanguageProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
