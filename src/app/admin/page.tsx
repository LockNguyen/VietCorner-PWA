import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EventAdmin from "@/features/events/components/EventAdmin";
import { getManagedEvents } from "@/features/events/server/queries";
import { MANAGE_EVENTS } from "@/features/events/types";
import GroupAdmin from "@/features/groups/components/GroupAdmin";
import { getGroups, getJoinRequests } from "@/features/groups/server/queries";
import { MANAGE_GROUPS } from "@/features/groups/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import PrayerReminderAdmin from "@/features/prayer/components/PrayerReminderAdmin";
import { getPrayerReminders } from "@/features/prayer/server/queries";
import { MANAGE_PRAYER_REMINDERS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// The admin page is a list of sections, one per thing that can be managed. Each feature brings its own
// section and names the permission it needs; this page only decides which sections this user gets.
// So a future "post writer" sees this page with one section, and removing a feature removes its section.
export default async function AdminPage() {
  const supabase = await createClient();
  const permissions = await getMyPermissions(supabase);
  // A member has no business here. This is courtesy, not security: with a forged token the page would
  // render, and every save would still be refused by the database.
  if (permissions.length === 0) notFound();

  // Groups are read once: the Groups section edits them, and the other sections offer them as a choice.
  const groups = await getGroups(supabase);
  const groupChoices = groups.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <PageHeader title={SHELL_STRINGS.adminTab} />
      {permissions.includes(MANAGE_EVENTS) && (
        <EventAdmin events={await getManagedEvents(supabase)} groups={groupChoices} />
      )}
      {permissions.includes(MANAGE_PRAYER_REMINDERS) && (
        <PrayerReminderAdmin reminders={await getPrayerReminders(supabase)} groups={groupChoices} />
      )}
      {permissions.includes(MANAGE_GROUPS) && <GroupAdmin groups={groups} requests={await getJoinRequests(supabase)} />}
    </>
  );
}
