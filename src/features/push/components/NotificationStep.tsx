"use client";

import SetupProgress from "@/components/SetupProgress";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { useNotificationStep } from "../hooks/useNotificationStep";
import { STRINGS } from "../strings";

// The setup screen that asks for notifications. The layout shows it in place of every screen until the
// person turns them on or says "not now". Blocked by the phone: it says where to allow them, and asks again.
export default function NotificationStep() {
  const { t } = useLanguage(); // I18N
  const { status, enable, decline } = useNotificationStep();
  const { pending, run } = usePending<"on">();
  const showBanner = useBanner();

  async function turnOn() {
    if (!(await enable())) showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
  }

  return (
    <div className="flex flex-col items-center gap-6 pb-6">
      <SetupProgress step="notifications" />
      <LogoMark />
      <div className="flex w-full flex-col gap-3 px-5 text-center">
        <Text as="h1" variant="tile">{t(STRINGS.askHeading)}</Text>
        <Text>{t(STRINGS.askWhy)}</Text>
        {status === "blocked" && <Text tone="danger">{t(STRINGS.notificationsBlocked)}</Text>}
        <Button pending={pending === "on"} disabled={status === "loading"} onClick={() => run("on", turnOn)}>
          {t(STRINGS.turnOn)}
        </Button>
        <Button variant="text" onClick={decline}>
          {t(STRINGS.notNow)}
        </Button>
      </div>
    </div>
  );
}
