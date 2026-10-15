"use client";

import SetupProgress, { type SetupStep } from "@/components/SetupProgress";
import LogoMark from "@/components/ui/LogoMark";
import LanguageLink from "@/features/i18n/components/LanguageLink"; // I18N

type Props = { step?: SetupStep; children: React.ReactNode };

// Every signed-out screen, in the app or in the browser an email link opens: the setup bar when it is a
// setup step, the other language at the top right, the logo, then the screen. One frame, so they all match.
export default function SignedOutFrame({ step, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 pb-6">
      {step ? <SetupProgress step={step} /> : <div className="pt-safe" />}
      <div className="flex w-full justify-end px-5">
        <LanguageLink />
      </div>
      <LogoMark />
      <div className="flex w-full flex-col gap-3 px-5">{children}</div>
    </div>
  );
}
