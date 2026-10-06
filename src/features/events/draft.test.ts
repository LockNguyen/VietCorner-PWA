import { describe, expect, it } from "vitest";
import { draftOf, emptyDraft, problemWith, rowOf, textOf } from "./draft";
import type { EventDraft, ManagedEvent } from "./types";

function draft(overrides: Partial<EventDraft> = {}): EventDraft {
  return {
    ...emptyDraft(),
    startsAt: "2026-12-02T19:00",
    texts: { en: { title: "Bible study", description: "", location: "" }, vi: { title: "", description: "", location: "" } },
    ...overrides,
  };
}

describe("what the form holds → what is stored", () => {
  it("stores 7 PM church time as the right instant, in winter and in summer", () => {
    expect(rowOf(draft()).starts_at).toBe("2026-12-03T00:00:00.000Z");
    expect(rowOf(draft({ startsAt: "2026-07-01T19:00" })).starts_at).toBe("2026-07-01T23:00:00.000Z");
  });

  it("stores no end time when the form has none", () => {
    expect(rowOf(draft()).ends_at).toBeNull();
  });

  it("drops 'repeat until' when the event does not repeat", () => {
    expect(rowOf(draft({ repeatsWeekly: false, repeatUntil: "2026-12-31" })).repeat_until).toBeNull();
    expect(rowOf(draft({ repeatsWeekly: true, repeatUntil: "2026-12-31" })).repeat_until).toBe("2026-12-31");
  });

  it("stores a language only when it has a title, with empty fields as nothing", () => {
    expect(textOf(draft(), "en")).toEqual({ title: "Bible study", description: null, location: null });
    expect(textOf(draft(), "vi")).toBeNull();
  });
});

describe("what stops a save", () => {
  it("nothing, for a title in one language and a start", () => {
    expect(problemWith(draft())).toBeNull();
  });

  it("no title in either language", () => {
    expect(problemWith(draft({ texts: emptyDraft().texts }))).toBe("noTitle");
  });

  it("no start", () => {
    expect(problemWith(draft({ startsAt: "" }))).toBe("noStart");
  });

  it("an end that is not after the start", () => {
    expect(problemWith(draft({ endsAt: "2026-12-02T19:00" }))).toBe("endsBeforeItStarts");
    expect(problemWith(draft({ endsAt: "2026-12-02T20:30" }))).toBeNull();
  });
});

describe("a stored event → what the form shows", () => {
  it("shows church time and both languages, and survives the round trip", () => {
    const stored: ManagedEvent = {
      id: "event-1",
      group_id: "group-1",
      starts_at: "2026-12-03T00:00:00.000Z",
      ends_at: "2026-12-03T01:30:00.000Z",
      repeats_weekly: true,
      repeat_until: "2026-12-31",
      canceled_at: null,
      texts: { vi: { title: "Học Kinh Thánh", description: null, location: "Phòng 2" } },
      upcoming: [],
      reminderMinutes: [],
    };

    const shown = draftOf(stored);

    expect(shown.startsAt).toBe("2026-12-02T19:00");
    expect(shown.endsAt).toBe("2026-12-02T20:30");
    expect(shown.texts.en.title).toBe("");
    expect(shown.texts.vi.location).toBe("Phòng 2");
    expect(rowOf(shown)).toEqual({
      group_id: "group-1",
      starts_at: stored.starts_at,
      ends_at: stored.ends_at,
      repeats_weekly: true,
      repeat_until: "2026-12-31",
    });
  });
});
