import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language } from "@/features/i18n/types";
import { isoDate } from "@/lib/churchTime";
import { isCanceled, startsOf, upcomingOccurrences, WEEKS_AHEAD } from "../occurrences";
import { EVENT_COLUMNS, type ChurchEvent, type EventRow, type EventText, type ManagedEvent, type Occurrence } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.
//
// RLS decides what comes back: church-wide events, plus events of the groups this member joined.
// Someone with the "events.manage" permission gets every group's events, on the schedule too (decided
// 2026-10-06). The policy that lets them remove an event also lets them read removed ones, so both
// queries below filter `deleted_at` themselves; for members the policy already did.

type TextRow = EventText & { event_id: string; language: Language };

// why: enough to cancel next week or the one after without scrolling a long list per event.
const DATES_SHOWN_TO_MANAGERS = 4;

// why: an event called off for good stays on the schedule, struck through, long enough for someone who
// missed the notification to see it at their next weekly visit. After that it is clutter.
const DAYS_A_CANCELLED_EVENT_STAYS = 7;

// Everything the schedule page shows: every date in the next few weeks, oldest first.
export async function getUpcomingSchedule(
  supabase: SupabaseClient,
  language: Language,
  now = new Date(),
): Promise<Occurrence[]> {
  // A weekly event that started months ago still runs today, so the window reaches back far enough to
  // catch those rows, and the expansion decides which dates actually fall ahead of `now`.
  const horizon = new Date(now.getTime() + WEEKS_AHEAD * 7 * 24 * 60 * 60 * 1000);
  const cancelledSince = new Date(now.getTime() - DAYS_A_CANCELLED_EVENT_STAYS * 24 * 60 * 60 * 1000);
  const { data: rows, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .is("deleted_at", null)
    .lte("starts_at", horizon.toISOString())
    .or(`repeats_weekly.eq.true,starts_at.gte.${now.toISOString()}`)
    .or(`canceled_at.is.null,canceled_at.gte.${cancelledSince.toISOString()}`); // the two .or() are ANDed
  if (error || !rows?.length) return [];

  const ids = rows.map((row: EventRow) => row.id);
  const events = await attachText(supabase, rows as EventRow[], ids, language);
  return upcomingOccurrences(events, await cancellations(supabase, ids), now);
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

// A member downloads their own language. Only events missing it fall back to the other one, which is why
// this is two queries rather than one that fetches every translation.
async function attachText(
  supabase: SupabaseClient,
  rows: EventRow[],
  ids: string[],
  language: Language,
): Promise<ChurchEvent[]> {
  const { data: preferred } = await supabase
    .from("event_texts")
    .select("event_id, language, title, description, location")
    .in("event_id", ids)
    .eq("language", language);

  const byEvent = new Map<string, EventText>((preferred ?? []).map((text: TextRow) => [text.event_id, text]));
  const untranslated = ids.filter((id) => !byEvent.has(id));

  if (untranslated.length > 0) {
    const { data: fallback } = await supabase
      .from("event_texts")
      .select("event_id, language, title, description, location")
      .in("event_id", untranslated);
    for (const text of (fallback ?? []) as TextRow[]) if (!byEvent.has(text.event_id)) byEvent.set(text.event_id, text);
  }

  // An event with no text at all cannot be rendered, and is dropped rather than shown as a blank row.
  return rows.flatMap((row) => {
    const text = byEvent.get(row.id);
    return text ? [{ ...row, text }] : [];
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
