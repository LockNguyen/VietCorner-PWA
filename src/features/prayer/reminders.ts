import { isoDate, toInstant } from "@/lib/churchTime";
import type { PrayerReminder } from "./types";

// Whether a group's weekly prayer reminder should go out now. Pure, so the timing is tested without a
// database or a clock.

// why: the scheduler runs every 15 minutes, so a reminder is noticed up to 15 minutes after its time; an
// hour of leeway also covers a few missed runs. Past that it is skipped: "time to pray" at 8 AM should not
// arrive at 5 PM because the server was down.
export const REMINDER_GRACE_MS = 60 * 60 * 1000;

// Due on its weekday, from its time, for one hour: all in church time.
// (A reminder set later than 11 PM loses the part of its hour that falls after midnight. Nobody sets one then.)
export function isDue(reminder: PrayerReminder, now: Date): boolean {
  const today = isoDate(now);
  if (new Date(`${today}T00:00:00Z`).getUTCDay() !== reminder.weekday) return false;

  const dueAt = toInstant(`${today}T${reminder.send_at.slice(0, 5)}`).getTime();
  return dueAt <= now.getTime() && now.getTime() < dueAt + REMINDER_GRACE_MS;
}
