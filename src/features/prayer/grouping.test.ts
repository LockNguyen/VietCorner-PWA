import { describe, expect, it } from "vitest";
import { byWeekThenPerson } from "./grouping";
import type { PrayerRequest } from "./types";

// Wednesday 14 October 2026, noon in Winston-Salem (EDT, UTC-4). That week's Sunday is 11 October.
const NOW = new Date("2026-10-14T16:00:00Z");

let nextId = 1;
function request(createdAt: string, author: string | null, isMine = false): PrayerRequest {
  return {
    id: String(nextId++),
    group_id: "g",
    group_name: "Bible Study",
    body: "please pray",
    is_anonymous: author === null,
    created_at: createdAt,
    is_mine: isMine,
    author_name: author,
  };
}

describe("the prayer list by week, then by person", () => {
  it("is empty for no requests", () => {
    expect(byWeekThenPerson([], NOW)).toEqual([]);
  });

  it("counts weeks back from the one that holds today", () => {
    const weeks = byWeekThenPerson(
      [
        request("2026-10-13T15:00:00Z", "An"), // this week
        request("2026-10-08T15:00:00Z", "An"), // last week
        request("2026-09-16T15:00:00Z", "An"), // four weeks ago
      ],
      NOW,
    );

    expect(weeks.map((week) => [week.start, week.weeksAgo])).toEqual([
      ["2026-10-11", 0],
      ["2026-10-04", 1],
      ["2026-09-13", 4],
    ]);
  });

  it("starts a week on Sunday in church time, not in UTC", () => {
    // 03:30 UTC on Sunday is still 11:30 PM on Saturday in Winston-Salem: the week that is ending.
    const [lateSaturday] = byWeekThenPerson([request("2026-10-11T03:30:00Z", "An")], NOW);
    // 04:30 UTC is half past midnight on Sunday there: the new week.
    const [earlySunday] = byWeekThenPerson([request("2026-10-11T04:30:00Z", "An")], NOW);

    expect(lateSaturday.weeksAgo).toBe(1);
    expect(earlySunday.weeksAgo).toBe(0);
  });

  it("counts whole weeks across the clock change in November", () => {
    const afterTheChange = new Date("2026-11-04T17:00:00Z"); // Wednesday, three days after clocks go back
    const [week] = byWeekThenPerson([request("2026-10-14T16:00:00Z", "An")], afterTheChange);

    expect(week.weeksAgo).toBe(3);
  });

  it("puts one person's requests of a week together, people in the order of their newest request", () => {
    const [week] = byWeekThenPerson(
      [
        request("2026-10-14T15:00:00Z", "Binh"),
        request("2026-10-13T15:00:00Z", "An"),
        request("2026-10-12T15:00:00Z", "Binh"),
      ],
      NOW,
    );

    expect(week.people.map((person) => [person.name, person.requests.length])).toEqual([
      ["Binh", 2],
      ["An", 1],
    ]);
  });

  it("puts my own named requests first in a week, however old, and leaves the others in order", () => {
    const [week] = byWeekThenPerson(
      [
        request("2026-10-14T15:00:00Z", "Binh"),
        request("2026-10-13T15:00:00Z", "An"),
        request("2026-10-12T15:00:00Z", "Chi", true),
      ],
      NOW,
    );

    expect(week.people.map((person) => person.name)).toEqual(["Chi", "Binh", "An"]);
  });

  it("keeps a person apart from themselves in another week", () => {
    const weeks = byWeekThenPerson([request("2026-10-13T15:00:00Z", "An"), request("2026-10-06T15:00:00Z", "An")], NOW);

    expect(weeks.map((week) => week.people.length)).toEqual([1, 1]);
  });

  it("keeps a week's anonymous requests together, mine among them", () => {
    const [week] = byWeekThenPerson(
      [request("2026-10-14T15:00:00Z", null, true), request("2026-10-13T15:00:00Z", null)],
      NOW,
    );

    expect(week.people).toHaveLength(1);
    expect(week.people[0]).toMatchObject({ name: null, mine: false });
  });

  it("keeps my named requests apart from a namesake's", () => {
    const [week] = byWeekThenPerson(
      [request("2026-10-14T15:00:00Z", "An", true), request("2026-10-13T15:00:00Z", "An")],
      NOW,
    );

    expect(week.people.map((person) => person.mine)).toEqual([true, false]);
  });
});
