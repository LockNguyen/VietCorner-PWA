"use client";

import type { SetupStep } from "@/components/SetupProgress";
import Spinner from "@/components/ui/Spinner";
import { useInstall } from "../hooks/useInstall";
import InstallGuide from "./InstallGuide";

type Props = {
  // Set while the person is still setting up: the guide then shows the bar, and nothing it wraps starts
  // before the device is known (the notifications question would answer itself "impossible" in a browser,
  // and iOS copies that answer into the installed app).
  step?: SetupStep;
  // Under the guide: a way out (sign out), since the guide takes the place of every page, Settings included.
  footer?: React.ReactNode;
  children: React.ReactNode;
};

// Signed in, but in a browser tab on a phone: the install guide in place of the page. Signing in happens in
// the browser first because only Safari saves and fills in passwords; iOS then copies the sign-in into the
// app at the moment it is added to the Home Screen (both seen on the iPhone, 2026-10-14).
export default function InstallGate({ step, footer, children }: Props) {
  const { device, showGuide, canInstall, installed, install, continueInBrowser } = useInstall();

  // The server cannot know how the page was opened; the phone tells us a moment after loading.
  if (device === null) {
    if (!step) return children; // an ordinary page: show it, and swap in the guide if this is a browser
    return (
      <div className="flex justify-center pt-24">
        <Spinner />
      </div>
    );
  }
  if (!showGuide || device === "installed") return children;

  return (
    <InstallGuide
      step={step}
      footer={footer}
      device={device}
      canInstall={canInstall}
      installed={installed}
      onInstall={install}
      onContinueInBrowser={continueInBrowser}
    />
  );
}
