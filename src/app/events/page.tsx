import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EventSchedule from "@/features/events/components/EventSchedule";
import { getScheduledEvents } from "@/features/events/server/queries";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// The schedule is read on the server, in one trip: RLS lets every approved member see it. Whoever may
// manage events also gets the + and opens an event to edit it (the database checks every save itself).
export default async function EventsPage() {
  const supabase = await createClient();
  const [events, permissions] = await Promise.all([getScheduledEvents(supabase), getMyPermissions(supabase)]);

  return (
    <>
      <PageHeader title={SHELL_STRINGS.eventsTab} backHref="/" />
      <EventSchedule events={events} canManage={permissions.includes(MANAGE_EVENTS)} />
    </>
  );
}
