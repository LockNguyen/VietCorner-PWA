"use client";

import { Ellipsis, EllipsisVertical, Share, SquarePlus } from "lucide-react";
import SetupProgress, { type SetupStep } from "@/components/SetupProgress";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import LanguageLink from "@/features/i18n/components/LanguageLink"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Device } from "../device";
import { STRINGS } from "../strings";
import InstallStep from "./InstallStep";

type Props = {
  step?: SetupStep; // a new member's setup: show the bar
  footer?: React.ReactNode; // set apart at the bottom: a way out of the guide (sign out)
  device: Exclude<Device, "installed">;
  canInstall: boolean; // Chrome offered its own dialog
  installed: boolean; // just installed from this tab
  onInstall: () => void;
  onContinueInBrowser: () => void;
};

// How to put the app on this phone, in the steps that fit it. Shown after signing in, in a browser tab.
export default function InstallGuide({ step, footer, device, canInstall, installed, onInstall, onContinueInBrowser }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col gap-6 pb-6">
      {step ? <SetupProgress step={step} /> : <div className="pt-safe" />}
      <div className="flex flex-col gap-6 px-5">
        <div className="flex justify-end">
          <LanguageLink />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <LogoMark />
          <Text as="h1" variant="tile">
            {installed ? t(STRINGS.installedHeading) : t(STRINGS.heading)}
          </Text>
          {!installed && <Text tone="subtle">{t(STRINGS.why)}</Text>}
        </div>

        {installed ? (
          <Text>{t(STRINGS.openFromHome)}</Text>
        ) : canInstall ? (
          // Android (and computers) that offer it: one tap, then the phone's own dialog.
          <Button onClick={onInstall}>{t(STRINGS.installButton)}</Button>
        ) : (
          <ol className="flex flex-col gap-5">
            {device === "iphone" && (
              <>
                <InstallStep number={1} icon={<Share aria-hidden />}>
                  {t(STRINGS.iphoneShare)}
                </InstallStep>
                <InstallStep number={2} icon={<SquarePlus aria-hidden />}>
                  {t(STRINGS.iphoneAdd)}
                </InstallStep>
                <InstallStep number={3}>{t(STRINGS.iphoneConfirm)}</InstallStep>
                <InstallStep number={4}>{t(STRINGS.openFromHome)}</InstallStep>
              </>
            )}
            {device === "android" && (
              <>
                <InstallStep number={1} icon={<EllipsisVertical aria-hidden />}>
                  {t(STRINGS.androidMenu)}
                </InstallStep>
                <InstallStep number={2}>{t(STRINGS.androidAdd)}</InstallStep>
                <InstallStep number={3}>{t(STRINGS.openFromHome)}</InstallStep>
              </>
            )}
            {device === "inApp" && (
              <>
                <InstallStep number={1} icon={<Ellipsis aria-hidden />}>
                  {t(STRINGS.inAppMenu)}
                </InstallStep>
                <InstallStep number={2}>{t(STRINGS.inAppOpen)}</InstallStep>
              </>
            )}
            {device === "other" && <InstallStep number={1}>{t(STRINGS.onYourPhone)}</InstallStep>}
          </ol>
        )}

        {/* Only a computer may skip: on a phone the app is what makes notifications and staying signed in work. */}
        {device === "other" && (
          <Button variant="text" onClick={onContinueInBrowser}>
            {t(STRINGS.continueInBrowser)}
          </Button>
        )}
        {footer && <div className="flex flex-col pt-6">{footer}</div>}
      </div>
    </div>
  );
}
