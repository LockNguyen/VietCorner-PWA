import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import AppTabs from "@/components/AppTabs";
import BannerHost from "@/components/BannerHost";
import WaitingStep from "@/features/approval/components/WaitingStep"; // APPROVAL
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import AdoptDeviceLanguage from "@/features/i18n/components/AdoptDeviceLanguage"; // I18N
import LanguageProvider from "@/features/i18n/components/LanguageProvider"; // I18N
import { getLanguage } from "@/features/i18n/server/queries"; // I18N
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE } from "@/features/i18n/types"; // I18N
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { managesSomething, USE_THE_APP } from "@/features/permissions/types"; // PERMISSIONS
import NameStep from "@/features/profiles/components/NameStep"; // PROFILES
import { getMyProfile } from "@/features/profiles/server/queries"; // PROFILES
import { AVATAR_BUCKET } from "@/features/profiles/types"; // PROFILES
import { createClient } from "@/lib/supabase/server";
import KeepSubscribed from "@/features/push/components/KeepSubscribed"; // PUSH
import InstallGate from "@/features/install/components/InstallGate"; // INSTALL
import NotificationStep from "@/features/push/components/NotificationStep"; // PUSH
import { NOTIFICATIONS_ASKED_COOKIE } from "@/features/push/types"; // PUSH
import { TEXT_SIZE_COOKIE, textSizeOf } from "@/features/text-size/types"; // TEXT-SIZE
import { MyPictureProvider } from "@/components/MyPicture";
import PageSlide from "@/components/PageSlide";
import { BannerProvider } from "@/lib/useBanner";
import RefreshSavedPage from "@/components/RefreshSavedPage";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { APP_NAME } from "@/lib/appName";
import launchScreens from "@/lib/launchScreens.json";
import { publicFileUrl } from "@/lib/publicFileUrl";

export const metadata: Metadata = {
  title: APP_NAME,
  // iOS reads these instead of manifest.ts when the app is added to the Home Screen.
  // "black-translucent" lets the blue top bar run up behind the status bar, with white clock and battery.
  // `startupImage`: the picture iOS shows while the app starts (made by scripts/make-launch-images.mjs).
  // iOS picks the one whose size matches the screen exactly; with none it shows black, then white.
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
    startupImage: launchScreens.map(({ width, height, ratio }) => ({
      url: `/launch/${width * ratio}x${height * ratio}.png`,
      media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
    })),
  },
  // Next.js writes only the newer `mobile-web-app-capable` for `capable`. Older guides say iOS shows launch
  // pictures only with Apple's own tag; without it (2026-10-14) none showed, even after re-adding the app.
  other: { "apple-mobile-web-app-capable": "yes" },
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
  // I18N the stored language · PERMISSIONS who may manage something gets the Admin tab · PROFILES the name,
  // and the picture on the top bar's Settings button.
  const [storedLanguage, permissions, profile] = user
    ? await Promise.all([getLanguage(supabase), getMyPermissions(supabase), getMyProfile(supabase, user.id)])
    : [null, [], null];
  const avatarPath = profile?.avatarPath; // PROFILES
  // PROFILES: someone who has not given their name yet is asked before they see anything else.
  const askName = profile !== null && !profile.named;
  // APPROVAL: someone no admin has let in yet waits. The database shows them nothing either way.
  const notLetIn = Boolean(user) && !askName && !permissions.includes(USE_THE_APP);
  // PUSH: a new member is first asked for notifications, once per device (a cookie). Members who simply
  // sign in again are not asked; the switch in Settings is theirs.
  const askNotifications = notLetIn && !(await cookies()).has(NOTIFICATIONS_ASKED_COOKIE);
  const textSize = textSizeOf((await cookies()).get(TEXT_SIZE_COOKIE)?.value); // TEXT-SIZE: this phone's choice
  // I18N: the account's language, else this device's choice (the website's language page), else Vietnamese.
  const deviceLanguage = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const language = storedLanguage ?? (isLanguage(deviceLanguage) ? deviceLanguage : DEFAULT_LANGUAGE);
  const waiting = notLetIn && !askNotifications;
  const step = askName ? <NameStep /> : askNotifications ? <NotificationStep /> : waiting ? <WaitingStep /> : null;

  return (
    <html lang={language} data-text-size={textSize}>
      <body className="bg-surface text-ink">
        <LanguageProvider language={language} signedIn={Boolean(user)}>
          <MyPictureProvider src={avatarPath ? publicFileUrl(AVATAR_BUCKET, avatarPath) : undefined}>
            <BannerProvider>
              <main className="mx-auto max-w-column">
                {/* The screen slides on forward and back (src/lib/slide.ts); the tab bar outside it stays. */}
                <PageSlide>
                {/* INSTALL: signed in on a phone's browser, the install guide comes first (InstallGate). */}
                {user ? (
                  <InstallGate step={notLetIn ? "install" : undefined}>
                    {step ?? children}
                  </InstallGate>
                ) : (
                  (step ?? children)
                )}
                </PageSlide>
              </main>
              <BannerHost />
            </BannerProvider>
          </MyPictureProvider>
          {user && !step && <AppTabs showAdmin={managesSomething(permissions)} bigText={textSize === "big"} />}
          {user && <AdoptDeviceLanguage storedLanguage={storedLanguage} />}
          {user && <KeepSubscribed />} {/* PUSH */}
        </LanguageProvider>
        <ServiceWorkerRegister />
        <RefreshSavedPage renderedAt={Date.now()} />
      </body>
    </html>
  );
}
