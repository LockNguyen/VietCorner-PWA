"use client";

import { Ellipsis, EllipsisVertical, Share, SquarePlus } from "lucide-react";
import SetupProgress, { type SetupStep } from "@/components/SetupProgress";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import LanguageLink from "@/features/i18n/components/LanguageLink"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { ButtonCorner, Device } from "../device";
import { STRINGS } from "../strings";
import InstallStep from "./InstallStep";
import ShareArrow from "./ShareArrow";

type Props = {
  step?: SetupStep; // a new member's setup: show the bar
  device: Exclude<Device, "installed">;
  glass: boolean; // iOS 26 Safari: Share is behind •••, one more step
  arrowAt: ButtonCorner | null; // where the browser's first button is, for the arrow beside the steps; null: none
  canInstall: boolean; // Chrome offered its own dialog
  installed: boolean; // just installed from this tab
  onInstall: () => void;
  onContinueInBrowser: () => void;
};

// How to put the app on this phone, in the steps that fit it, in the calm shape of the sign-in screens: the
// bar, the language at the top right, then in the middle the logo, a bold title and a few short lines, each
// with the button to look for in a grey circle. It covers the whole screen (no tab bar, no sign-out): on a
// phone the app is the way in, so there is nothing else to do here (the user, 2026-10-17).
export default function InstallGuide({ step, device, glass, arrowAt, canInstall, installed, onInstall, onContinueInBrowser }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-y-auto bg-surface pb-safe">
      {step ? <SetupProgress step={step} /> : <div className="pt-safe" />}
      {/* Left when the arrow takes the top right corner (Chrome's Share or ⋮ is up there). */}
      <div className={`flex min-h-touch w-full items-center px-3 pt-2 ${arrowAt === "topRight" ? "justify-start" : "justify-end"}`}>
        <LanguageLink />
      </div>
      <div className="mx-auto flex w-full max-w-column flex-1 flex-col items-center justify-center gap-6 px-5 pb-16">
        <LogoMark />
        <Text as="h1" variant="tile">
          {installed ? t(STRINGS.installedHeading) : t(STRINGS.heading)}
        </Text>

        {installed ? (
          <Text>{t(STRINGS.openFromHome)}</Text>
        ) : canInstall ? (
          // Android (and computers) that offer it: one tap, then the phone's own dialog.
          <div className="flex w-full flex-col">
            <Button onClick={onInstall}>{t(STRINGS.installButton)}</Button>
          </div>
        ) : (
          <>
            <ol className="flex w-full flex-col gap-4">
              {device === "iphone" && (
                <>
                  {glass && <InstallStep icon={<Ellipsis />}>{t(STRINGS.iphoneMore)}</InstallStep>}
                  <InstallStep icon={<Share />}>{t(STRINGS.iphoneShare)}</InstallStep>
                  <InstallStep icon={<SquarePlus />}>{t(STRINGS.iphoneAdd)}</InstallStep>
                  <InstallStep icon={t(STRINGS.addWord)}>{t(STRINGS.iphoneConfirm)}</InstallStep>
                </>
              )}
              {device === "iphoneChrome" && (
                <>
                  <InstallStep icon={<Share />}>{t(STRINGS.chromeShare)}</InstallStep>
                  <InstallStep icon={<SquarePlus />}>{t(STRINGS.iphoneAdd)}</InstallStep>
                  <InstallStep icon={t(STRINGS.addWord)}>{t(STRINGS.iphoneConfirm)}</InstallStep>
                </>
              )}
              {device === "android" && (
                <>
                  <InstallStep icon={<EllipsisVertical />}>{t(STRINGS.androidMenu)}</InstallStep>
                  <InstallStep icon={<SquarePlus />}>{t(STRINGS.androidAdd)}</InstallStep>
                </>
              )}
              {device === "inApp" && (
                <>
                  <InstallStep icon={<Ellipsis />}>{t(STRINGS.inAppMenu)}</InstallStep>
                  <InstallStep icon={<Share />}>{t(STRINGS.inAppOpen)}</InstallStep>
                </>
              )}
            </ol>
            {arrowAt && <ShareArrow corner={arrowAt} />}
            {device === "other" ? (
              <Text tone="subtle">{t(STRINGS.onYourPhone)}</Text>
            ) : (
              device !== "inApp" && <Text tone="subtle">{t(STRINGS.openFromHome)}</Text>
            )}
          </>
        )}

        {/* Only a computer may skip: on a phone the app is what makes notifications and staying signed in work. */}
        {device === "other" && (
          <Button variant="text" onClick={onContinueInBrowser}>
            {t(STRINGS.continueInBrowser)}
          </Button>
        )}
      </div>
    </div>
  );
}
