import type { SupabaseClient } from "@supabase/supabase-js";
import { isoDate } from "@/lib/churchTime";
import { isCanceled, scheduleWindow, startsOf } from "../occurrences";
import type { ManagedEvent, ScheduledEvent } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.
//
// RLS decides what comes back: every event, for every approved member (events are church-wide since
// 2026-10-12). Someone with the "events.manage" permission could also read removed ones, so both reads
// below leave those out themselves.

// why: enough to cancel next week or the one after without scrolling a long list per event.
const DATES_SHOWN_TO_MANAGERS = 4;

// Everything the schedule page shows, in one trip to the database: `upcoming_events()` (schema.sql).
// The browser makes the same call to refresh the list (api.ts).
export async function getScheduledEvents(supabase: SupabaseClient, now = new Date()): Promise<ScheduledEvent[]> {
  const { data, error } = await supabase.rpc("upcoming_events", scheduleWindow(now));
  if (error) return []; // also the answer before schema.sql has been run
  return data;
}

// Everything the admin section lists, in one trip to the database: `managed_events()` (schema.sql). Every
// event that still has a date ahead and was not called off for good, soonest first, with its next few
// dates worked out here. Needs the "events.manage" permission to return more than a member would see.
export async function getManagedEvents(supabase: SupabaseClient, now = new Date()): Promise<ManagedEvent[]> {
  const { data, error } = await supabase.rpc("managed_events");
  if (error) return []; // also the answer before schema.sql has been run

  return (data as ManagedRow[]).map(({ canceled_dates, reminder_minutes, ...row }) => {
    const canceledDates = new Set(canceled_dates);
    return {
      ...row,
      upcoming: startsOf(row, now)
        .slice(0, DATES_SHOWN_TO_MANAGERS)
        .map((startsAt) => ({
          churchDate: isoDate(startsAt),
          startsAt: startsAt.toISOString(),
          canceled: isCanceled(row, canceledDates, startsAt),
        })),
      reminderMinutes: reminder_minutes,
    };
  });
}

// One row of `managed_events()`: an event as stored, before its next dates are worked out.
type ManagedRow = ScheduledEvent & { reminder_minutes: number[] };
