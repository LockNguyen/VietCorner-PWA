"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SHELL_STRINGS } from "./strings";

// Every step a new member goes through, in order. Each feature's step screen names its own, so the bar
// stays right when a step is removed: delete its name here. Signing in is not a step (it is the whole of it
// for someone with an account): choosing the text size is step 1, then name and email (the user, 2026-10-17). "done" is never shown: it is there so that the last screen,
// waiting for an admin, reads as not finished yet (asked for by the user, 2026-10-14).
// "install" comes after signing in (in Safari, whose sign-in iOS copies into the app as it is added) and before
// notifications (which only work in the installed app).
const SETUP_STEPS = ["textSize", "name", "email", "install", "notifications", "waiting", "done"] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

// "Step 3 of 7" over a bar, at the top of every setup screen, so a person can see how close they are.
export default function SetupProgress({ step }: { step: SetupStep }) {
  const { t } = useLanguage(); // I18N
  const number = SETUP_STEPS.indexOf(step) + 1;

  return (
    // Two boxes: the outer clears the phone's clock and notch (no top bar on these screens), the inner adds space.
    <div className="w-full pt-safe">
      <div className="flex flex-col gap-2 px-5 pt-6">
        <Text variant="small" tone="subtle">
          {t(SHELL_STRINGS.setupStep)} {number} / {SETUP_STEPS.length}
        </Text>
        <ProgressBar value={number} max={SETUP_STEPS.length} />
      </div>
    </div>
  );
}
