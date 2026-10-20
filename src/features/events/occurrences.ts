import { addWeeks, isoDate } from "@/lib/churchTime";
import type { Language } from "@/features/i18n/types"; // I18N
import type { ChurchEvent, EventRow, Occurrence, ScheduledEvent } from "./types";

// Turning stored events into the dates a member sees.
//
// A weekly event is stored once, not copied per week: the database keeps one row plus the weeks that were
// cancelled. Expanding it is pure arithmetic, so it lives here and is tested without a database.

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// why: far enough that a monthly glance at the schedule is complete, short enough that a never-ending
// weekly event does not generate hundreds of rows nobody scrolls to.
export const WEEKS_AHEAD = 8;

// When `event` starts, each time, between `from` and `from + WEEKS_AHEAD`, oldest first.
export function startsOf(event: EventRow, from: Date): Date[] {
  const horizon = new Date(from.getTime() + WEEKS_AHEAD * MILLISECONDS_PER_WEEK);
  const first = new Date(event.starts_at);

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
  return dates;
}

// Whether the date starting at `startsAt` is off: the whole event called off, or just this week.
// `canceledDates` holds the church's calendar dates (YYYY-MM-DD) of single weeks that were called off.
export function isCanceled(event: EventRow, canceledDates: Set<string>, startsAt: Date): boolean {
  return Boolean(event.canceled_at) || canceledDates.has(isoDate(startsAt));
}

// The same dates as the schedule shows them: with the event's text, its end, and whether each is off.
export function occurrencesOf(event: ChurchEvent, canceledDates: Set<string>, from: Date): Occurrence[] {
  const length = event.ends_at ? new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime() : null;

  return startsOf(event, from).map((startsAt) => ({
    event,
    startsAt,
    endsAt: length === null ? null : new Date(startsAt.getTime() + length),
    canceled: isCanceled(event, canceledDates, startsAt),
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

// why: an event called off for good stays on the schedule, struck through, long enough for someone who
// missed the notification to see it at their next weekly visit. After that it is clutter.
const WEEKS_A_CANCELLED_EVENT_STAYS = 1;

// How far the schedule looks, as the two instants `upcoming_events()` takes.
export function scheduleWindow(now: Date) {
  return {
    until: new Date(now.getTime() + WEEKS_AHEAD * MILLISECONDS_PER_WEEK).toISOString(),
    cancelled_since: new Date(now.getTime() - WEEKS_A_CANCELLED_EVENT_STAYS * MILLISECONDS_PER_WEEK).toISOString(),
  };
}

// The schedule a reader of `language` sees: each event in their language, or in the other one when theirs
// is missing. An event with no words at all cannot be shown, and is left out rather than drawn blank.
export function scheduleOf(events: ScheduledEvent[], language: Language, from: Date): Occurrence[] {
  const readable = events.flatMap((event) => {
    const text = event.texts[language] ?? Object.values(event.texts)[0];
    return text ? [{ ...event, text }] : [];
  });
  const canceledDates = new Map(events.map((event) => [event.id, new Set(event.canceled_dates)]));

  return upcomingOccurrences(readable, canceledDates, from);
}

// The first date of each event, in the order given (soonest first): a weekly event is shown once, at its
// next date, never a second week ahead (the user, 2026-10-17: one instance at all times).
export function nextOfEach(occurrences: Occurrence[]): Occurrence[] {
  const seen = new Set<string>();
  return occurrences.filter((occurrence) => !seen.has(occurrence.event.id) && seen.add(occurrence.event.id));
}

// One day's events as cards: those at the same place (same location, address and contact) share one card, in
// the order given; any other stays alone. Two services on one Sunday morning at the church were two identical
// pictures repeating the same place and number (the user, 2026-10-20). An event with no location is never merged.
export function cardsOf(dayOccurrences: Occurrence[]): Occurrence[][] {
  const cards = new Map<string, Occurrence[]>();
  for (const occurrence of dayOccurrences) {
    const { event } = occurrence;
    const place = event.text.location ? JSON.stringify([event.text.location, event.address, event.contact_phone]) : event.id;
    cards.set(place, [...(cards.get(place) ?? []), occurrence]);
  }
  return [...cards.values()];
}
