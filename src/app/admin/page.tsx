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
import NameRequestAdmin from "@/features/profiles/components/NameRequestAdmin"; // PROFILES
import { getNameRequests, getNames } from "@/features/profiles/server/queries"; // PROFILES
import PrayerReminderAdmin from "@/features/prayer/components/PrayerReminderAdmin";
import { getPrayerReminders } from "@/features/prayer/server/queries";
import { MANAGE_PRAYER_REMINDERS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// A list of sections, one per thing that can be managed. Each feature brings its section and names the
// permission it needs; this page only decides which sections this user gets (the admin README).
export default async function AdminPage() {
  const supabase = await createClient();
  const permissions = await getMyPermissions(supabase);
  // A member has no business here. This is courtesy, not security: with a forged token the page would
  // render, and every save would still be refused by the database.
  if (permissions.length === 0) notFound();

  const managesGroups = permissions.includes(MANAGE_GROUPS);
  const nothing = Promise.resolve([]);

  // Read together: none of these needs another's answer. A section the user may not manage is not read.
  // Groups are read once: the Groups section edits them, and the other sections offer them as a choice.
  const [groups, events, reminders, requests, nameRequests] = await Promise.all([
    getGroups(supabase),
    permissions.includes(MANAGE_EVENTS) ? getManagedEvents(supabase) : nothing,
    permissions.includes(MANAGE_PRAYER_REMINDERS) ? getPrayerReminders(supabase) : nothing,
    managesGroups ? getJoinRequests(supabase) : nothing,
    managesGroups ? getNameRequests(supabase) : nothing, // PROFILES
  ]);
  const groupChoices = groups.map(({ id, name }) => ({ id, name }));
  // What the people waiting are called now: the one read that needs the two lists first. PROFILES
  const names = await getNames(supabase, [...requests, ...nameRequests].map((request) => request.user_id));

  return (
    <>
      <PageHeader title={SHELL_STRINGS.adminTab} />
      {permissions.includes(MANAGE_EVENTS) && <EventAdmin events={events} groups={groupChoices} editorPath="/admin/events" />}
      {permissions.includes(MANAGE_PRAYER_REMINDERS) && <PrayerReminderAdmin reminders={reminders} groups={groupChoices} />}
      {managesGroups && <NameRequestAdmin requests={nameRequests} names={names} />} {/* PROFILES */}
      {managesGroups && <GroupAdmin groups={groups} requests={requests} names={names} />}
    </>
  );
}
