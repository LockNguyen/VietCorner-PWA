"use client";

import { Bell } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import RoundIcon from "@/components/ui/RoundIcon";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePushNotifications } from "../hooks/usePushNotifications";
import { STRINGS } from "../strings";

// The Settings row for notifications: on or off on this phone, opening the screen with the switch.
export default function NotificationRow() {
  const { t } = useLanguage(); // I18N
  const { status } = usePushNotifications();
  const value = status === "loading" ? undefined : t(status === "on" ? STRINGS.on : STRINGS.off);

  return (
    <ListRow
      href="/settings/notifications"
      leading={<RoundIcon tone="pray" size="small"><Bell /></RoundIcon>}
      title={t(STRINGS.heading)}
      value={value}
    />
  );
}
