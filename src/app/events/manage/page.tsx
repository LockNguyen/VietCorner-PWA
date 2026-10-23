import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RefreshOnArrival from "@/components/RefreshOnArrival";
import EventManageList from "@/features/events/components/EventManageList";
import { getManagedEvents, getWeeklyCard } from "@/features/events/server/queries";
import { STRINGS } from "@/features/events/strings";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// Everything an admin edits on the schedule, opened by the Edit button on the Events tab (the user, 2026-10-21):
// the weekly card, then the events, weekly and one-time; each row slides in its editor. Courtesy, not security:
// the database refuses every save without the permission.
export default async function ManageEventsPage() {
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(MANAGE_EVENTS)) notFound();
  const [card, events] = await Promise.all([getWeeklyCard(supabase), getManagedEvents(supabase)]);

  return (
    <>
      <PageHeader title={STRINGS.editSchedule} backHref="/events" />
      {/* Back from an editor after a save: the router's kept copy would list the old titles. */}
      <RefreshOnArrival />
      <EventManageList card={card} events={events} />
    </>
  );
}
