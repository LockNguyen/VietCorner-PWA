import { describe, expect, it } from "vitest";
import { isoDate, wallTime } from "@/lib/churchTime";
import { occurrencesOf, scheduleOf, scheduleWindow, upcomingOccurrences, WEEKS_AHEAD } from "./occurrences";
import type { ChurchEvent, ScheduledEvent } from "./types";

const MONDAY = new Date("2026-10-05T18:00:00Z");

function makeEvent(overrides: Partial<ChurchEvent> = {}): ChurchEvent {
  return {
    id: "event-1",
    starts_at: MONDAY.toISOString(),
    ends_at: null,
    repeats_weekly: false,
    repeat_until: null,
    canceled_at: null,
    thumbnail_path: null,
    text: { title: "Prayer evening", description: null, location: null },
    ...overrides,
  };
}

describe("a one-off event", () => {
  it("happens once", () => {
    const dates = occurrencesOf(makeEvent(), new Set(), new Date("2026-10-01T00:00:00Z"));

    expect(dates).toHaveLength(1);
    expect(dates[0].startsAt.toISOString()).toBe(MONDAY.toISOString());
  });

  it("disappears once it is in the past", () => {
    const dates = occurrencesOf(makeEvent(), new Set(), new Date("2026-10-06T00:00:00Z"));

    expect(dates).toEqual([]);
  });

  it("keeps its length when it has an end time", () => {
    const event = makeEvent({ ends_at: new Date("2026-10-05T19:30:00Z").toISOString() });

    const [first] = occurrencesOf(event, new Set(), new Date("2026-10-01T00:00:00Z"));

    expect(first.endsAt?.toISOString()).toBe("2026-10-05T19:30:00.000Z");
  });
});

describe("a weekly event", () => {
  it("repeats weekly up to the horizon and no further", () => {
    const from = new Date("2026-10-01T00:00:00Z");

    const dates = occurrencesOf(makeEvent({ repeats_weekly: true }), new Set(), from);

    // The horizon is WEEKS_AHEAD from today, not from the first occurrence: this event starts four days
    // in, so the last week that fits is the eighth one counted from today.
    const horizon = new Date(from.getTime() + WEEKS_AHEAD * 7 * 24 * 60 * 60 * 1000);
    expect(dates[0].startsAt.toISOString()).toBe("2026-10-05T18:00:00.000Z");
    expect(dates[1].startsAt.toISOString()).toBe("2026-10-12T18:00:00.000Z");
    expect(dates.at(-1)?.startsAt.getTime()).toBeLessThanOrEqual(horizon.getTime());
    expect(dates.at(-1)!.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000).toBeGreaterThan(horizon.getTime());
  });

  it("keeps its hour on the wall when the clocks go back", () => {
    // Wednesday 7 PM, church time. The clocks change on 1 November 2026.
    const event = makeEvent({ starts_at: "2026-10-21T23:00:00Z", repeats_weekly: true });

    const dates = occurrencesOf(event, new Set(), new Date("2026-10-20T00:00:00Z"));

    expect(dates.slice(0, 4).map((date) => wallTime(date.startsAt))).toEqual([
      "2026-10-21T19:00",
      "2026-10-28T19:00",
      "2026-11-04T19:00",
      "2026-11-11T19:00",
    ]);
  });

  it("matches a cancelled week by the church's date, even when UTC is already on the next day", () => {
    // 7 PM on Wednesday 4 November is midnight UTC on the 5th.
    const event = makeEvent({ starts_at: "2026-10-28T23:00:00Z", repeats_weekly: true, repeat_until: "2026-11-04" });

    const dates = occurrencesOf(event, new Set(["2026-11-04"]), new Date("2026-10-20T00:00:00Z"));

    expect(dates.map((date) => date.canceled)).toEqual([false, true]);
  });

  it("stops at repeat_until", () => {
    const event = makeEvent({ repeats_weekly: true, repeat_until: "2026-10-20" });

    const dates = occurrencesOf(event, new Set(), new Date("2026-10-01T00:00:00Z"));

    expect(dates.map((date) => isoDate(date.startsAt))).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
  });

  it("marks a single cancelled week without losing the rest", () => {
    const event = makeEvent({ repeats_weekly: true, repeat_until: "2026-10-20" });

    const dates = occurrencesOf(event, new Set(["2026-10-12"]), new Date("2026-10-01T00:00:00Z"));

    expect(dates.map((date) => date.canceled)).toEqual([false, true, false]);
  });

  it("is cancelled in every week once the whole event is called off", () => {
    const event = makeEvent({ repeats_weekly: true, canceled_at: new Date().toISOString() });

    const dates = occurrencesOf(event, new Set(), new Date("2026-10-01T00:00:00Z"));

    expect(dates.every((date) => date.canceled)).toBe(true);
  });
});

describe("the whole schedule", () => {
  it("is one chronological list across events", () => {
    const soon = makeEvent({ id: "soon", starts_at: "2026-10-06T10:00:00Z" });
    const later = makeEvent({ id: "later", starts_at: "2026-10-09T10:00:00Z" });
    const weekly = makeEvent({ id: "weekly", starts_at: "2026-10-07T10:00:00Z", repeats_weekly: true });

    const schedule = upcomingOccurrences([later, weekly, soon], new Map(), new Date("2026-10-05T00:00:00Z"));

    expect(schedule.slice(0, 3).map((occurrence) => occurrence.event.id)).toEqual(["soon", "weekly", "later"]);
  });
});

describe("the schedule as the database hands it over", () => {
  const BEFORE = new Date("2026-10-01T00:00:00Z");
  const stored = (overrides: Partial<ScheduledEvent> = {}): ScheduledEvent => {
    const { text, ...row } = makeEvent();
    return { ...row, texts: { en: text }, canceled_dates: [], ...overrides };
  };

  it("shows each event in the reader's language", () => {
    const event = stored({ texts: { en: { title: "Prayer", description: null, location: null }, vi: { title: "Cầu nguyện", description: null, location: null } } });

    expect(scheduleOf([event], "vi", BEFORE)[0].event.text.title).toBe("Cầu nguyện");
    expect(scheduleOf([event], "en", BEFORE)[0].event.text.title).toBe("Prayer");
  });

  it("falls back to the other language rather than hiding the event", () => {
    expect(scheduleOf([stored()], "vi", BEFORE)[0].event.text.title).toBe("Prayer evening");
  });

  it("leaves out an event with no words at all", () => {
    expect(scheduleOf([stored({ texts: {} })], "vi", BEFORE)).toEqual([]);
  });

  it("marks the single weeks that were called off", () => {
    const weekly = stored({ repeats_weekly: true, canceled_dates: [isoDate(new Date(MONDAY.getTime() + 7 * 86_400_000))] });

    expect(scheduleOf([weekly], "en", BEFORE).slice(0, 3).map((date) => date.canceled)).toEqual([false, true, false]);
  });

  it("asks the database for eight weeks ahead and one week of cancelled events behind", () => {
    expect(scheduleWindow(new Date("2026-10-08T00:00:00Z"))).toEqual({
      until: "2026-12-03T00:00:00.000Z",
      cancelled_since: "2026-10-01T00:00:00.000Z",
    });
  });
});
