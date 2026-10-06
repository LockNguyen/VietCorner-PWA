import { isCanceled, startsOf } from "./occurrences";
import type { EventRow } from "./types";

// Which reminders of an event should go out now. Pure, so the timing rules are tested without a database
// or a clock.

// why: the scheduler runs every 15 minutes, so a reminder is noticed up to 15 minutes after its moment.
// An hour of leeway also covers a few missed runs. Past that it is skipped rather than sent late: "starts in
// a day" arriving five hours later is worse than nothing, and it stops an event created at the last minute
// from firing every reminder at once.
export const REMINDER_GRACE_MS = 60 * 60 * 1000;

export type DueReminder = { startsAt: Date; minutesBefore: number };

// A reminder is due from "`minutesBefore` before the start" for one hour, and never once the date has
// started. Cancelled dates have none.
export function dueReminders(
  event: EventRow,
  minutesBeforeChoices: number[],
  canceledDates: Set<string>,
  now: Date,
): DueReminder[] {
  return startsOf(event, now) // only dates that have not started yet
    .filter((startsAt) => !isCanceled(event, canceledDates, startsAt))
    .flatMap((startsAt) =>
      minutesBeforeChoices
        .filter((minutesBefore) => {
          const dueAt = startsAt.getTime() - minutesBefore * 60 * 1000;
          return dueAt <= now.getTime() && now.getTime() < dueAt + REMINDER_GRACE_MS;
        })
        .map((minutesBefore) => ({ startsAt, minutesBefore })),
    );
}
