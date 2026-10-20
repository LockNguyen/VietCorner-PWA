"use client";

import { useState } from "react";
import type { SetupStep } from "@/components/SetupProgress";
import Spinner from "@/components/ui/Spinner";
import LanguageChoice from "@/features/i18n/components/LanguageChoice"; // I18N
import { useInstall } from "../hooks/useInstall";
import InstallGuide from "./InstallGuide";

type Props = {
  // Set while the person is still setting up: the guide then shows the bar, and nothing it wraps starts
  // before the device is known (the notifications question would answer itself "impossible" in a browser,
  // and iOS copies that answer into the installed app).
  step?: SetupStep;
  // The sign-in screen on the website: ask the language first, then the guide (the user, 2026-10-20).
  askLanguage?: boolean;
  children: React.ReactNode;
};

// In a browser tab on a phone: the install guide in place of the page.
// On `/login` (askLanguage) it comes BEFORE signing in or creating an account, so every sign-in happens inside
// the installed app (2026-10-20). Before, people signed in in the browser and relied on iOS copying the sign-in
// into the app as it was added; iOS copies only regular Safari's cookies, so someone in Chrome or a Private tab
// installed an app that was signed out (the root cause of the first such report, the install README).
// Still wraps signed-in pages in the root layout, for a session that began in a browser anyway (a computer, Android).
export default function InstallGate({ step, askLanguage = false, children }: Props) {
  const { device, glass, arrowAt, showGuide, canInstall, installed, install, continueInBrowser } = useInstall();
  const [languageChosen, setLanguageChosen] = useState(false); // asked once per visit, never in the app

  // The server cannot know how the page was opened; the phone tells us a moment after loading.
  if (device === null) {
    // An ordinary page: show it, and swap in the guide if this is a browser.
    if (!step && !askLanguage) return children;
    return (
      <div className="flex justify-center pt-24">
        <Spinner />
      </div>
    );
  }
  if (!showGuide || device === "installed") return children;
  if (askLanguage && !languageChosen) return <LanguageChoice onChosen={() => setLanguageChosen(true)} />;

  return (
    <InstallGuide
      step={step}
      device={device}
      glass={glass}
      arrowAt={arrowAt}
      canInstall={canInstall}
      installed={installed}
      onInstall={install}
      onContinueInBrowser={continueInBrowser}
    />
  );
}
