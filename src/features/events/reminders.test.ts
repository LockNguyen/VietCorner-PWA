import { describe, expect, it } from "vitest";
import { dueReminders } from "./reminders";
import type { EventRow } from "./types";

// Wednesday 14 October 2026, 7 PM church time.
const START = "2026-10-14T23:00:00Z";
const at = (iso: string) => new Date(iso);

function event(overrides: Partial<EventRow> = {}): EventRow {
  return { id: "e", group_id: null, starts_at: START, ends_at: null, repeats_weekly: false, repeat_until: null, canceled_at: null, ...overrides };
}

const minutes = (event_: EventRow, choices: number[], now: string, canceled: string[] = []) =>
  dueReminders(event_, choices, new Set(canceled), at(now)).map((due) => due.minutesBefore);

describe("an event reminder", () => {
  it("is not due before its moment", () => {
    expect(minutes(event(), [120], "2026-10-14T20:59:00Z")).toEqual([]);
  });

  it("is due from its moment, for an hour", () => {
    expect(minutes(event(), [120], "2026-10-14T21:00:00Z")).toEqual([120]);
    expect(minutes(event(), [120], "2026-10-14T21:59:00Z")).toEqual([120]);
    expect(minutes(event(), [120], "2026-10-14T22:00:00Z")).toEqual([]);
  });

  it("is never due once the event has started", () => {
    expect(minutes(event(), [30], "2026-10-14T22:45:00Z")).toEqual([30]);
    expect(minutes(event(), [30], "2026-10-14T23:01:00Z")).toEqual([]);
  });

  it("does not fire every choice at once for an event created at the last minute", () => {
    // 20 minutes before the start: only the 30-minute reminder is still inside its hour.
    expect(minutes(event(), [1440, 120, 30], "2026-10-14T22:40:00Z")).toEqual([30]);
  });

  it("is not sent for a cancelled date, or a cancelled event", () => {
    const weekly = event({ repeats_weekly: true });

    expect(minutes(weekly, [120], "2026-10-14T21:10:00Z", ["2026-10-14"])).toEqual([]);
    expect(minutes(event({ canceled_at: START }), [120], "2026-10-14T21:10:00Z")).toEqual([]);
  });

  it("follows a weekly event to its later dates, at the same hour on the wall after the clocks change", () => {
    const weekly = event({ repeats_weekly: true });
    // Three weeks on, 4 November, the church is on winter time: 7 PM is 00:00 UTC, so 2 hours before is 22:00.
    const due = dueReminders(weekly, [120], new Set(), at("2026-11-04T22:05:00Z"));

    expect(due.map((reminder) => reminder.startsAt.toISOString())).toEqual(["2026-11-05T00:00:00.000Z"]);
  });
});
