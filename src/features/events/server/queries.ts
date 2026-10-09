import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language } from "@/features/i18n/types";
import { isoDate } from "@/lib/churchTime";
import { isCanceled, scheduleWindow, startsOf } from "../occurrences";
import { EVENT_COLUMNS, type EventRow, type EventText, type ManagedEvent, type ScheduledEvent } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.
//
// RLS decides what comes back: church-wide events, plus events of the groups this member joined.
// Someone with the "events.manage" permission gets every group's events, on the schedule too (decided
// 2026-10-06), and could also read removed ones, so both reads below leave those out themselves.

type TextRow = EventText & { event_id: string; language: Language };

// why: enough to cancel next week or the one after without scrolling a long list per event.
const DATES_SHOWN_TO_MANAGERS = 4;

// Everything the schedule page shows, in one trip to the database: `upcoming_events()` (schema.sql).
// The browser makes the same call to refresh the list (api.ts).
export async function getScheduledEvents(supabase: SupabaseClient, now = new Date()): Promise<ScheduledEvent[]> {
  const { data, error } = await supabase.rpc("upcoming_events", scheduleWindow(now));
  if (error) return []; // also the answer before schema.sql has been run
  return data;
}

// Everything the admin section lists: every event that still has a date ahead and was not called off for
// good, soonest first, with its text in every language and its next few dates. Needs the "events.manage" permission to return more than
// a member would see.
export async function getManagedEvents(supabase: SupabaseClient, now = new Date()): Promise<ManagedEvent[]> {
  const { data: rows, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .is("deleted_at", null)
    .is("canceled_at", null) // called off for good = gone from here; it cannot be brought back from the app
    .or(`repeats_weekly.eq.true,starts_at.gte.${now.toISOString()}`)
    .order("starts_at");
  if (error || !rows?.length) return [];

  const ids = rows.map((row: EventRow) => row.id);
  const [{ data: texts }, { data: reminders }, canceledDates] = await Promise.all([
    supabase.from("event_texts").select("event_id, language, title, description, location").in("event_id", ids),
    supabase.from("event_reminders").select("event_id, minutes_before").in("event_id", ids),
    cancellations(supabase, ids),
  ]);

  return (rows as EventRow[]).map((row) => {
    const ownTexts = ((texts ?? []) as TextRow[]).filter((text) => text.event_id === row.id);
    const ownCancellations = canceledDates.get(row.id) ?? new Set();

    return {
      ...row,
      texts: Object.fromEntries(ownTexts.map(({ language, title, description, location }) => [language, { title, description, location }])),
      upcoming: startsOf(row, now)
        .slice(0, DATES_SHOWN_TO_MANAGERS)
        .map((startsAt) => ({
          churchDate: isoDate(startsAt),
          startsAt: startsAt.toISOString(),
          canceled: isCanceled(row, ownCancellations, startsAt),
        })),
      reminderMinutes: (reminders ?? []).filter((reminder) => reminder.event_id === row.id).map((reminder) => reminder.minutes_before),
    };
  });
}

// The single weeks that were called off, grouped by event.
async function cancellations(supabase: SupabaseClient, ids: string[]): Promise<Map<string, Set<string>>> {
  const { data } = await supabase
    .from("event_cancellations")
    .select("event_id, occurrence_date")
    .in("event_id", ids);

  const byEvent = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const dates = byEvent.get(row.event_id) ?? new Set<string>();
    dates.add(row.occurrence_date);
    byEvent.set(row.event_id, dates);
  }
  return byEvent;
}
