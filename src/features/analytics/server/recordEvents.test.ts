import { describe, expect, it } from "vitest";
import { EVENTS_PER_REQUEST } from "../types";
import { validEvents } from "./recordEvents";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const EVENT = {
  visit_id: "0b6c7c1e-8a52-4a49-9d3c-6f1d1b2a3c4d",
  at: "2026-10-22T11:59:00Z",
  kind: "page",
  path: "/events",
  target: null,
  ms: 1234.6,
  detail: { from: "/" },
};

describe("validEvents", () => {
  it("keeps a well-formed event, with whole milliseconds", () => {
    expect(validEvents([EVENT], NOW)).toEqual([{ ...EVENT, at: "2026-10-22T11:59:00.000Z", ms: 1235 }]);
  });

  it("keeps only the known fields: nothing else reaches the table", () => {
    const [event] = validEvents([{ ...EVENT, user_id: "someone-else", id: 1 }], NOW);
    expect(Object.keys(event).sort()).toEqual(["at", "detail", "kind", "ms", "path", "target", "visit_id"]);
  });

  it("drops what is malformed, of an unknown kind, or dated far from now", () => {
    const bad = [
      null,
      "page",
      { ...EVENT, kind: "drop table" },
      { ...EVENT, visit_id: "not-a-uuid" },
      { ...EVENT, path: "events" },
      { ...EVENT, target: "x".repeat(301) },
      { ...EVENT, ms: -1 },
      { ...EVENT, detail: [] },
      { ...EVENT, at: "2026-10-20T12:00:00Z" },
      { ...EVENT, at: "2027-01-01T00:00:00Z" },
    ];
    expect(validEvents(bad, NOW)).toEqual([]);
  });

  it("takes at most one request's worth, and nothing from a body that is not a list", () => {
    expect(validEvents(Array(EVENTS_PER_REQUEST + 5).fill(EVENT), NOW)).toHaveLength(EVENTS_PER_REQUEST);
    expect(validEvents({ events: [EVENT] }, NOW)).toEqual([]);
  });
});
