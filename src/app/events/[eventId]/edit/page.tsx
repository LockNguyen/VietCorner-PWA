import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EventEditor from "@/features/events/components/EventEditor";
import { getManagedEvents } from "@/features/events/server/queries";
import { STRINGS } from "@/features/events/strings";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// The editor for one event, opened by an admin tapping its card on the schedule (there is no page per event:
// the card says it all, the user 2026-10-19). Saving leads back
// to the schedule. Courtesy, not security: the database refuses every save without the permission.
export default async function EventEditorPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(MANAGE_EVENTS)) notFound();

  // The whole list is read to show one event: it is a handful of rows in one trip (`managed_events()`),
  // and it is the read that already works out each event's next dates and reminders.
  const event = (await getManagedEvents(supabase)).find((managed) => managed.id === eventId);
  if (!event) notFound();

  return (
    <>
      <PageHeader title={STRINGS.editEvent} backHref="/events" />
      <EventEditor event={event} listHref="/events" />
    </>
  );
}
