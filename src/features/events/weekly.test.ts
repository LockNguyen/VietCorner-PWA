import { describe, expect, it } from "vitest";
import type { Occurrence } from "./types";
import { byWeekday, weeklyLineOf } from "./weekly";

function occurrence(startsAt: string, title: string): Occurrence {
  const event = {
    id: title,
    starts_at: startsAt,
    ends_at: null,
    repeats_weekly: true,
    repeat_until: null,
    canceled_at: null,
    thumbnail_path: null,
    contact_phone: null,
    address: null,
    text: { title, description: null, location: null },
  };
  return { event, startsAt: new Date(startsAt), endsAt: null, canceled: false };
}

describe("a weekly event's line", () => {
  it("is on the church's weekday and wall clock, whatever UTC says", () => {
    // Saturday 24 October 2026, 9 PM at church = Sunday 01:00 UTC.
    expect(weeklyLineOf(occurrence("2026-10-25T01:00:00Z", "Youth"))).toEqual({ weekday: 6, time: "21:00", title: "Youth" });
  });
});

describe("the weekly card's days", () => {
  it("starts on Sunday, puts each day's lines in time order and leaves out empty days", () => {
    const days = byWeekday([
      { weekday: 1, time: "19:30", title: "Kannapolis" },
      { weekday: 0, time: "10:30", title: "Worship" },
      { weekday: 0, time: "09:15", title: "Sunday School" },
    ]);

    expect(days.map(([weekday, lines]) => [weekday, lines.map((line) => line.title)])).toEqual([
      [0, ["Sunday School", "Worship"]],
      [1, ["Kannapolis"]],
    ]);
  });
});
