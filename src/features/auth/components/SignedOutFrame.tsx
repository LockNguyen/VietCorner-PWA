"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import SetupProgress, { type SetupStep } from "@/components/SetupProgress";
import { SHELL_STRINGS } from "@/components/strings";
import IconButton from "@/components/ui/IconButton";
import LogoMark from "@/components/ui/LogoMark";
import LanguageLink from "@/features/i18n/components/LanguageLink"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N

type Props = {
  step?: SetupStep;
  onBack?: () => void; // a back arrow at the left of the language line (sign-up goes back to sign-in)
  children: ReactNode;
};

// Every signed-out screen, in the app or in the browser an email link opens: the setup bar when it is a
// setup step, a line with a back arrow at the left (when there is a way back) and the other language at the
// right, then the logo and the screen in the middle of what is left, so a short screen does not hang at the top.
export default function SignedOutFrame({ step, onBack, children }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-1 flex-col">
      {step ? <SetupProgress step={step} /> : <div className="pt-safe" />}
      <div className="flex min-h-touch w-full items-center justify-between px-3 pt-2">
        {onBack ? (
          <IconButton tone="action" label={t(SHELL_STRINGS.back)} onClick={onBack}>
            <ChevronLeft />
          </IconButton>
        ) : (
          <span />
        )}
        <LanguageLink />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-16">
        <LogoMark />
        <div className="flex w-full flex-col gap-3 px-5">{children}</div>
      </div>
    </div>
  );
}
