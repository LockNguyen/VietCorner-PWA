"use client";

import { Bell } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Switch from "@/components/ui/Switch";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { STRINGS } from "../strings";

// Settings block: notifications on this device, on or off. Where the phone itself stands in the way
// (blocked, or the app is not on the Home Screen), the switch is off and a line says what to do.
export default function NotificationSection() {
  const { status, enable, disable } = usePushNotifications();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"switch">();
  const showBanner = useBanner();

  async function set(on: boolean) {
    if (!(await (on ? enable() : disable()))) showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
  }

  return (
    <section>
      <SectionHeading variant="large" icon={<Bell />}>{t(STRINGS.heading)}</SectionHeading>
      <div className="flex flex-col gap-1 px-3">
        <Switch
          label={t(STRINGS.onThisDevice)}
          checked={status === "on"}
          disabled={pending !== null || (status !== "on" && status !== "off")}
          onChange={(change) => {
            const wanted = change.target.checked; // read now: the event object is reused once this handler returns
            run("switch", () => set(wanted));
          }}
        />
        {status === "blocked" && <Text variant="small" tone="subtle">{t(STRINGS.notificationsBlocked)}</Text>}
        {status === "unsupported" && <Text variant="small" tone="subtle">{t(STRINGS.notificationsUnsupported)}</Text>}
      </div>
    </section>
  );
}
