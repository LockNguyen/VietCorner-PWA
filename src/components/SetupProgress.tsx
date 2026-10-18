"use client";

import { useEffect, useState } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import Text from "@/components/ui/Text";
import { NOTIFICATIONS_ASKED_COOKIE } from "@/features/push/types"; // PUSH
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { stepsFor, type SetupStep } from "./setupSteps";
import { SHELL_STRINGS } from "./strings";

export type { SetupStep } from "./setupSteps";

// "Step 2 of 5" over a bar, at the top of every setup screen, so a person can see how close they are. It
// counts only the steps this phone will show (setupSteps.ts). Those depend on the phone, which the server
// cannot see, so the count appears just after the first draw.
export default function SetupProgress({ step }: { step: SetupStep }) {
  const { t } = useLanguage(); // I18N
  const [steps, setSteps] = useState<SetupStep[] | null>(null);

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true; // the iPhone's own flag
    setSteps(
      stepsFor(
        {
          installed,
          notificationsAnswered: document.cookie.includes(`${NOTIFICATIONS_ASKED_COOKIE}=`),
          canNotify: "serviceWorker" in navigator && "PushManager" in window,
        },
        step,
      ),
    );
  }, [step]);

  const number = steps ? steps.indexOf(step) + 1 : 0;

  return (
    // Two boxes: the outer clears the phone's clock and notch (no top bar on these screens), the inner adds space.
    <div className="w-full pt-safe">
      <div className={`flex flex-col gap-2 px-5 pt-6 ${steps ? "" : "invisible"}`}>
        <Text variant="small" tone="subtle">
          {t(SHELL_STRINGS.setupStep)} {number} / {steps?.length}
        </Text>
        <ProgressBar value={number} max={steps?.length ?? 1} />
      </div>
    </div>
  );
}
