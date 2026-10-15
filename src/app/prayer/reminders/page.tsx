import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import PrayerReminderAdmin from "@/features/prayer/components/PrayerReminderAdmin";
import { getPrayerReminders } from "@/features/prayer/server/queries";
import { STRINGS } from "@/features/prayer/strings";
import { MANAGE_PRAYER_REMINDERS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// The weekly prayer reminders, opened from the bell on the Prayer tab. Courtesy, not security: the database
// refuses every change without the permission.
export default async function PrayerRemindersPage() {
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(MANAGE_PRAYER_REMINDERS)) notFound();

  return (
    <>
      <PageHeader title={STRINGS.remindersHeading} backHref="/prayer" />
      <PrayerReminderAdmin reminders={await getPrayerReminders(supabase)} />
    </>
  );
}
