import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language } from "@/features/i18n/types";
import { upcomingOccurrences, WEEKS_AHEAD } from "../occurrences";
import type { ChurchEvent, EventRow, EventText, Occurrence } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.
//
// RLS decides what comes back: church-wide events, plus events of the groups this member joined.
// Soft-deleted rows are excluded by the policy itself, so no `deleted_at` filter is needed here.

type TextRow = EventText & { event_id: string; language: Language };

// Everything the schedule page shows: every date in the next few weeks, oldest first.
export async function getUpcomingSchedule(
  supabase: SupabaseClient,
  language: Language,
  now = new Date(),
): Promise<Occurrence[]> {
  // A weekly event that started months ago still runs today, so the window reaches back far enough to
  // catch those rows, and the expansion decides which dates actually fall ahead of `now`.
  const horizon = new Date(now.getTime() + WEEKS_AHEAD * 7 * 24 * 60 * 60 * 1000);
  const { data: rows, error } = await supabase
    .from("events")
    .select("id, group_id, starts_at, ends_at, repeats_weekly, repeat_until, canceled_at")
    .lte("starts_at", horizon.toISOString())
    .or(`repeats_weekly.eq.true,starts_at.gte.${now.toISOString()}`);
  if (error || !rows?.length) return [];

  const ids = rows.map((row: EventRow) => row.id);
  const events = await attachText(supabase, rows as EventRow[], ids, language);
  return upcomingOccurrences(events, await cancellations(supabase, ids), now);
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
