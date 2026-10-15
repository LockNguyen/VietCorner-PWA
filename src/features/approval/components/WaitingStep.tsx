"use client";

import SetupProgress from "@/components/SetupProgress";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import NotificationSection from "@/features/push/components/NotificationSection"; // PUSH
import { useWaitForApproval } from "../hooks/useWaitForApproval";
import { STRINGS } from "../strings";

// What a new account sees until an admin lets it in. The layout shows it in place of every screen, the way
// it shows the name question, so there is no address that skips it.
export default function WaitingStep() {
  const { t } = useLanguage(); // I18N
  const { checking, check } = useWaitForApproval();

  return (
    <div className="flex flex-col gap-6 pb-6">
      <SetupProgress step="waiting" />
      <div className="flex flex-col items-center gap-6 px-5 text-center">
        <LogoMark />
        <div className="flex flex-col gap-2">
          <Text as="h1" variant="tile">{t(STRINGS.waiting)}</Text>
          <Text tone="subtle">{t(STRINGS.whatHappensNext)}</Text>
          <Text tone="subtle">{t(STRINGS.turnOnToBeTold)}</Text>
        </div>
      </div>
      <NotificationSection /> {/* PUSH */}
      <div className="flex flex-col px-5">
        <Button variant="quiet" pending={checking} onClick={check}>
          {t(STRINGS.checkAgain)}
        </Button>
      </div>
    </div>
  );
}
