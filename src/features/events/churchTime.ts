// Church time: every date and time in this feature is the one on the wall in Winston-Salem.
//
// The database stores an event as an instant (a point on the world's timeline). People think in wall time
// ("Wednesday, 7 PM"). The two differ by an offset that changes twice a year, so "one week later" is not
// always 168 hours later: across the clock change it is 167 or 169. Everything that needs the wall clock
// goes through this file, so the server (which runs on UTC) and a phone (anywhere) always agree.
//
// A wall time is written "YYYY-MM-DDTHH:mm", the same shape an <input type="datetime-local"> uses.
// Pure functions, tested without a DOM. No date library: `Intl` already knows the timezone's rules.

// why: the church is in Winston-Salem, NC (decided 2026-10-06). One congregation, one place.
export const CHURCH_TIME_ZONE = "America/New_York";

const WALL_CLOCK = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHURCH_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// What the church's wall clock and calendar show at this instant.
export function wallTime(instant: Date): string {
  const part = Object.fromEntries(WALL_CLOCK.formatToParts(instant).map(({ type, value }) => [type, value]));
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
}

// The church's calendar date at this instant (YYYY-MM-DD). It is how a cancelled week is recorded and
// how the schedule groups events under a day.
export function isoDate(instant: Date): string {
  return wallTime(instant).slice(0, 10);
}

// The instant at which the church's wall clock shows `wall`.
//
// There is no direct way to ask that, so it is found by correcting a guess: read `wall` as if it were UTC,
// see how far the church's clock is from UTC at that moment, and step back by that much. The second
// pass matters only within a few hours of a clock change, where the first guess lands on the wrong side.
// (An hour skipped in spring resolves to the hour after it; an hour repeated in autumn to its first pass.)
export function toInstant(wall: string): Date {
  const asIfUtc = Date.parse(`${wall}:00Z`);
  const offsetAt = (instant: number) => Date.parse(`${wallTime(new Date(instant))}:00Z`) - instant;

  const firstGuess = asIfUtc - offsetAt(asIfUtc);
  return new Date(asIfUtc - offsetAt(firstGuess));
}

// The same wall-clock time, `weeks` weeks later: a 7 PM event stays at 7 PM when the clocks change.
export function addWeeks(instant: Date, weeks: number): Date {
  const wall = wallTime(instant);
  const laterDay = new Date(Date.parse(`${wall.slice(0, 10)}T00:00:00Z`) + weeks * 7 * 24 * 60 * 60 * 1000);
  return toInstant(`${laterDay.toISOString().slice(0, 10)}${wall.slice(10)}`);
}
