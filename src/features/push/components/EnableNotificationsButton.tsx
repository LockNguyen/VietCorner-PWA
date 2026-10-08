"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { STRINGS } from "../strings";

// This device's notification state, with a button to turn notifications on when they are off.
export default function EnableNotificationsButton() {
  const { status, enable } = usePushNotifications();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"enable">();
  const showBanner = useBanner();

  async function turnOn() {
    if (!(await enable())) showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
  }

  if (status === "loading") return null;

  return (
    <div className="flex flex-col gap-2 border-b border-line p-3">
      {status === "on" && <Text variant="small" tone="subtle">{t(STRINGS.notificationsOn)}</Text>}
      {status === "blocked" && <Text variant="small" tone="subtle">{t(STRINGS.notificationsBlocked)}</Text>}
      {status === "unsupported" && <Text variant="small" tone="subtle">{t(STRINGS.notificationsUnsupported)}</Text>}
      {status === "off" && (
        <Button pending={pending === "enable"} onClick={() => run("enable", turnOn)}>
          {t(STRINGS.turnOnNotifications)}
        </Button>
      )}
    </div>
  );
}
