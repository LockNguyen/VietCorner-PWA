import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EventSchedule from "@/features/events/components/EventSchedule";
import { getScheduledEvents } from "@/features/events/server/queries";
import { createClient } from "@/lib/supabase/server";

// The schedule is read on the server, in one trip: RLS lets every approved member see it.
export default async function EventsPage() {
  const events = await getScheduledEvents(await createClient());

  return (
    <>
      <PageHeader title={SHELL_STRINGS.eventsTab} />
      <EventSchedule events={events} />
    </>
  );
}
