import { isoDate } from "@/lib/churchTime";
import type { PrayerRequest } from "./types";

// The prayer list as it is drawn: by week, then by person. Pure, so the calendar work is tested without a screen.
//
// A week starts on Sunday in church time (decided 2026-10-08), so a request posted late on Saturday in
// Winston-Salem belongs to the week that is ending, wherever the reader's phone is.

export type PersonGroup = {
  name: string | null; // null = the anonymous requests of that week, kept together
  mine: boolean; // a named group of my own requests
  requests: PrayerRequest[];
};

export type WeekGroup = {
  start: string; // the week's Sunday, YYYY-MM-DD
  weeksAgo: number; // 0 = this week
  people: PersonGroup[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The Sunday that starts the church week holding this instant, counted in days since 1970: whole numbers,
// so two weeks are compared by subtracting, with no clock change in the way.
function weekStartDay(instant: Date): number {
  const day = Date.parse(`${isoDate(instant)}T00:00:00Z`) / DAY_MS;
  return day - new Date(day * DAY_MS).getUTCDay();
}

// `requests` are newest first, as the feed holds them. That order is kept: the newest week first, people
// in a week by their newest request, and a person's requests newest first.
export function byWeekThenPerson(requests: PrayerRequest[], now = new Date()): WeekGroup[] {
  const thisWeek = weekStartDay(now);
  const weeks: WeekGroup[] = [];

  for (const request of requests) {
    const startDay = weekStartDay(new Date(request.created_at));
    const start = new Date(startDay * DAY_MS).toISOString().slice(0, 10);

    let week = weeks.find((candidate) => candidate.start === start);
    if (!week) weeks.push((week = { start, weeksAgo: (thisWeek - startDay) / 7, people: [] }));

    // The feed carries no author id (that is what keeps anonymous requests anonymous), so a person is
    // their name. Two members with one name share a group; mine are kept apart from a namesake's.
    const name = request.is_anonymous ? null : request.author_name;
    const mine = !request.is_anonymous && request.is_mine;
    let person = week.people.find((candidate) => candidate.name === name && candidate.mine === mine);
    if (!person) week.people.push((person = { name, mine, requests: [] }));

    person.requests.push(request);
  }

  return weeks;
}
