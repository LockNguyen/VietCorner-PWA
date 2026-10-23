import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EventSchedule from "@/features/events/components/EventSchedule";
import { getScheduledEvents, getWeeklyCard } from "@/features/events/server/queries";
import { MANAGE_EVENTS, type WeeklyMeeting } from "@/features/events/types";
import { getGroupDirectory } from "@/features/group-info/server/queries"; // GROUP-INFO
import type { DirectoryGroup } from "@/features/group-info/types"; // GROUP-INFO
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// The schedule is read on the server, in one trip per table: RLS lets every approved member see it. The groups'
// meetings join the weekly card here, so events imports nothing of group-info (2026-10-21). Whoever may manage
// events also gets the Edit button (the database checks every save itself).
export default async function EventsPage() {
  const supabase = await createClient();
  const [events, weeklyCard, groups, permissions] = await Promise.all([
    getScheduledEvents(supabase),
    getWeeklyCard(supabase),
    getGroupDirectory(supabase), // GROUP-INFO
    getMyPermissions(supabase),
  ]);

  return (
    <>
      <PageHeader title={SHELL_STRINGS.eventsTab} backHref="/" />
      <EventSchedule
        events={events}
        weeklyCard={weeklyCard}
        meetings={groups.flatMap(meetingOf)} // GROUP-INFO: [] without it
        canManage={permissions.includes(MANAGE_EVENTS)}
      />
    </>
  );
}

// GROUP-INFO: a group that meets on a set day and time is a line of the weekly card, under its name in each
// language (the English name falls back to the Vietnamese one), leading to the group's page. A group without
// both is left out.
function meetingOf(group: DirectoryGroup): WeeklyMeeting[] {
  if (group.meets_weekday === null || group.meets_time === null) return [];
  return [
    {
      weekday: group.meets_weekday,
      time: group.meets_time.slice(0, 5),
      title: { vi: group.name, en: group.name_en ?? "" },
      href: `/groups/${group.id}/about`,
    },
  ];
}
