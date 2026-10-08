"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { STRINGS } from "../strings";

// Shows this device's notification state, with a button to turn notifications on.
// The logic lives in hooks/usePushNotifications.ts.
export default function EnableNotificationsButton() {
  const { status, enable } = usePushNotifications();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"enable">();

  const box = "m-4 rounded border p-3";
  if (status === "loading") return null;
  if (status === "on") return <p className={box}>{t(STRINGS.notificationsOn)}</p>;
  if (status === "blocked") return <p className={box}>{t(STRINGS.notificationsBlocked)}</p>;
  if (status === "unsupported")
    return <p className={box}>{t(STRINGS.notificationsUnsupported)}</p>;

  return (
    <div className={box}>
      <ActionButton
        pending={pending === "enable"}
        onClick={() => run("enable", enable)}
        className="w-full rounded bg-blue-500 p-3 text-lg text-white"
      >
        {t(STRINGS.turnOnNotifications)}
      </ActionButton>
      {status === "error" && <p className="mt-2 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </div>
  );
}
