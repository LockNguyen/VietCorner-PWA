import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EventEditor from "@/features/events/components/EventEditor";
import { getManagedEvents } from "@/features/events/server/queries";
import { STRINGS } from "@/features/events/strings";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

const SCHEDULE = "/events"; // where the editor came from, and where saving leads back to

// The editor for one event, or for a new one at `/events/new`. Opened from the Events tab by an admin.
export default async function EventEditorPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  // Courtesy, not security: the database refuses every save without the permission.
  if (!(await getMyPermissions(supabase)).includes(MANAGE_EVENTS)) notFound();

  // The whole list is read to show one event: it is a handful of rows in one trip (`managed_events()`),
  // and it is the read that already works out each event's next dates and reminders.
  const event = (await getManagedEvents(supabase)).find((managed) => managed.id === eventId);
  if (!event && eventId !== "new") notFound();

  return (
    <>
      <PageHeader title={event ? STRINGS.editEvent : STRINGS.newEvent} backHref={SCHEDULE} />
      <EventEditor event={event} listHref={SCHEDULE} />
    </>
  );
}
