import PageHeader from "@/components/PageHeader";
import NotificationSwitch from "@/features/push/components/NotificationSwitch";
import { STRINGS } from "@/features/push/strings";

// Settings > Notifications: the switch for this phone.
export default function SettingsNotificationsPage() {
  return (
    <>
      <PageHeader title={STRINGS.heading} backHref="/settings" />
      <div className="pt-4">
        <NotificationSwitch />
      </div>
    </>
  );
}
