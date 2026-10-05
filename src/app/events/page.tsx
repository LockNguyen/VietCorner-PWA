import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EventSchedule from "@/features/events/components/EventSchedule";
import { getUpcomingSchedule } from "@/features/events/server/queries";
import { getLanguage } from "@/features/i18n/server/queries"; // I18N
import { DEFAULT_LANGUAGE } from "@/features/i18n/types"; // I18N
import { createClient } from "@/lib/supabase/server";

// The schedule is read on the server: RLS decides which events this member may see, and the expansion of
// weekly events happens before anything reaches the browser.
export default async function EventsPage() {
  const supabase = await createClient();
  const language = (await getLanguage(supabase)) ?? DEFAULT_LANGUAGE; // I18N
  const occurrences = await getUpcomingSchedule(supabase, language);

  return (
    <>
      <PageHeader title={SHELL_STRINGS.eventsTab} />
      <EventSchedule
        occurrences={occurrences.map((occurrence) => ({
          ...occurrence,
          startsAt: occurrence.startsAt.toISOString(),
          endsAt: occurrence.endsAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
