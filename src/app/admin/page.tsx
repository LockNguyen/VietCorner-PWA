import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import WaitingAccounts from "@/features/approval/components/WaitingAccounts"; // APPROVAL
import { getWaitingAccounts } from "@/features/approval/server/queries"; // APPROVAL
import { MANAGE_ACCOUNTS } from "@/features/approval/types"; // APPROVAL
import { SHELL_STRINGS } from "@/components/strings";
import EventAdmin from "@/features/events/components/EventAdmin";
import { getManagedEvents } from "@/features/events/server/queries";
import { MANAGE_EVENTS } from "@/features/events/types";
import GroupAdmin from "@/features/groups/components/GroupAdmin";
import { getGroupPeople, getGroups, getJoinRequests } from "@/features/groups/server/queries";
import { MANAGE_GROUPS } from "@/features/groups/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { managesSomething } from "@/features/permissions/types";
import NameRequestAdmin from "@/features/profiles/components/NameRequestAdmin"; // PROFILES
import { getNameRequests, getNames } from "@/features/profiles/server/queries"; // PROFILES
import PrayerReminderAdmin from "@/features/prayer/components/PrayerReminderAdmin";
import { getPrayerReminders } from "@/features/prayer/server/queries";
import { MANAGE_PRAYER_REMINDERS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";
import { SWITCHES } from "@/lib/switches";

// A list of sections, one per thing that can be managed. Each feature brings its section and names the
// permission it needs; this page only decides which sections this user gets (the admin README).
export default async function AdminPage() {
  const supabase = await createClient();
  const permissions = await getMyPermissions(supabase);
  // A member has no business here. This is courtesy, not security: with a forged token the page would
  // render, and every save would still be refused by the database.
  if (!managesSomething(permissions)) notFound();

  const managesGroups = permissions.includes(MANAGE_GROUPS);
  const nothing = Promise.resolve([]);

  // Read together: none of these needs another's answer. A section the user may not manage is not read.
  const [groups, events, reminders, requests, nameRequests, waiting, people] = await Promise.all([
    getGroups(supabase),
    permissions.includes(MANAGE_EVENTS) ? getManagedEvents(supabase) : nothing,
    permissions.includes(MANAGE_PRAYER_REMINDERS) ? getPrayerReminders(supabase) : nothing,
    managesGroups && SWITCHES.joining ? getJoinRequests(supabase) : nothing,
    managesGroups ? getNameRequests(supabase) : nothing, // PROFILES
    permissions.includes(MANAGE_ACCOUNTS) ? getWaitingAccounts(supabase) : nothing, // APPROVAL
    managesGroups ? getGroupPeople(supabase) : nothing,
  ]);
  // What the people waiting are called now: the one read that needs the two lists first. PROFILES
  const names = await getNames(supabase, [...requests, ...nameRequests].map((request) => request.user_id));

  return (
    <>
      <PageHeader title={SHELL_STRINGS.adminTab} />
      {permissions.includes(MANAGE_ACCOUNTS) && <WaitingAccounts accounts={waiting} />} {/* APPROVAL */}
      {permissions.includes(MANAGE_EVENTS) && <EventAdmin events={events} editorPath="/admin/events" />}
      {permissions.includes(MANAGE_PRAYER_REMINDERS) && <PrayerReminderAdmin reminders={reminders} />}
      {managesGroups && <NameRequestAdmin requests={nameRequests} names={names} />} {/* PROFILES */}
      {managesGroups && <GroupAdmin groups={groups} people={people} requests={requests} names={names} />}
    </>
  );
}
