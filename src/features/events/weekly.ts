import { wallTime } from "@/lib/churchTime";
import type { Occurrence, WeeklyLine } from "./types";

// The weekly card's lines (the user, 2026-10-21): every weekly event and group meeting under its weekday,
// Sunday first. Pure, so it is tested without a screen.

// A weekly event's line: the weekday and time of its next date, on the church's wall clock.
export function weeklyLineOf({ event, startsAt }: Occurrence): WeeklyLine {
  const wall = wallTime(startsAt); // "YYYY-MM-DDTHH:mm"
  // Noon UTC on the church's date is that same date, so `getUTCDay` reads the church's weekday.
  const weekday = new Date(`${wall.slice(0, 10)}T12:00:00Z`).getUTCDay();
  return { weekday, time: wall.slice(11), title: event.text.title };
}

// The lines under their weekdays, Sunday first, each day's in time order. A day with nothing is left out.
export function byWeekday(lines: WeeklyLine[]): [number, WeeklyLine[]][] {
  const sorted = [...lines].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
  const days = new Map<number, WeeklyLine[]>();
  for (const line of sorted) days.set(line.weekday, [...(days.get(line.weekday) ?? []), line]);
  return [...days.entries()];
}
