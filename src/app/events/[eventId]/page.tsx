import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EventPage from "@/features/events/components/EventPage";
import { getScheduledEvents } from "@/features/events/server/queries";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// One event's page, opened from the Events tab by anyone: the schedule's own read (`upcoming_events()`),
// so it shows exactly what the list showed. An event no longer on the schedule answers 404.
export default async function EventDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const [events, permissions] = await Promise.all([getScheduledEvents(supabase), getMyPermissions(supabase)]);
  const event = events.find((each) => each.id === eventId);
  if (!event) notFound();

  return (
    <>
      {/* The title in the reader's language, or the other one when the event has only one. */}
      <PageHeader title={{ en: event.texts.en?.title ?? "", vi: event.texts.vi?.title ?? "" }} backHref="/events" />
      <EventPage event={event} canManage={permissions.includes(MANAGE_EVENTS)} />
    </>
  );
}
