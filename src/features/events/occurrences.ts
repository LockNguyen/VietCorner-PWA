import { addWeeks, isoDate } from "./churchTime";
import type { ChurchEvent, Occurrence } from "./types";

// Turning stored events into the dates a member sees.
//
// A weekly event is stored once, not copied per week: the database keeps one row plus the weeks that were
// cancelled. Expanding it is pure arithmetic, so it lives here and is tested without a database.

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// why: far enough that a monthly glance at the schedule is complete, short enough that a never-ending
// weekly event does not generate hundreds of rows nobody scrolls to.
export const WEEKS_AHEAD = 8;

// The dates `event` happens on between `from` and `from + WEEKS_AHEAD`, oldest first.
// `canceledDates` holds the church's calendar dates (YYYY-MM-DD) of single weeks that were called off.
export function occurrencesOf(event: ChurchEvent, canceledDates: Set<string>, from: Date): Occurrence[] {
  const horizon = new Date(from.getTime() + WEEKS_AHEAD * MILLISECONDS_PER_WEEK);
  const first = new Date(event.starts_at);
  const length = event.ends_at ? new Date(event.ends_at).getTime() - first.getTime() : null;

  const dates: Date[] = [];
  // Each week is counted from the first date, in church time, so the event keeps its hour on the wall
  // when the clocks change (churchTime.ts).
  for (let week = 0; ; week++) {
    const startsAt = addWeeks(first, week);
    if (startsAt > horizon) break;
    if (event.repeat_until && isoDate(startsAt) > event.repeat_until) break;
    if (startsAt >= from) dates.push(startsAt);
    if (!event.repeats_weekly) break;
  }

  return dates.map((startsAt) => ({
    event,
    startsAt,
    endsAt: length === null ? null : new Date(startsAt.getTime() + length),
    // The whole event called off, or just this week.
    canceled: Boolean(event.canceled_at) || canceledDates.has(isoDate(startsAt)),
  }));
}

// Every event expanded and merged into one chronological list: what the page renders.
export function upcomingOccurrences(
  events: ChurchEvent[],
  canceledDatesByEvent: Map<string, Set<string>>,
  from: Date,
): Occurrence[] {
  return events
    .flatMap((event) => occurrencesOf(event, canceledDatesByEvent.get(event.id) ?? new Set(), from))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}
