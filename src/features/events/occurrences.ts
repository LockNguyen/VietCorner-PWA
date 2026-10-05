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
// `canceledDates` holds the ISO dates (YYYY-MM-DD) of single weeks that were called off.
export function occurrencesOf(event: ChurchEvent, canceledDates: Set<string>, from: Date): Occurrence[] {
  const horizon = new Date(from.getTime() + WEEKS_AHEAD * MILLISECONDS_PER_WEEK);
  const length = event.ends_at ? new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime() : null;
  const repeatUntil = event.repeat_until ? new Date(`${event.repeat_until}T23:59:59`) : null;

  const dates: Date[] = [];
  for (let startsAt = new Date(event.starts_at); startsAt <= horizon; ) {
    if (startsAt >= from) dates.push(new Date(startsAt));
    if (!event.repeats_weekly) break;
    startsAt = new Date(startsAt.getTime() + MILLISECONDS_PER_WEEK);
    if (repeatUntil && startsAt > repeatUntil) break;
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

// The local calendar date, which is how a cancellation is recorded and how the list groups days.
export function isoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
