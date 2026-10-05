import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrayedAt, savePrayedAt } from "./storage";

// A stand-in for the browser's localStorage, so these tests need no DOM.
function fakeStorage() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
  };
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

describe("the stored prayer times", () => {
  it("come back the way they were saved", () => {
    savePrayedAt("user-1", { a: 1, b: 2 });

    expect(loadPrayedAt("user-1")).toEqual({ a: 1, b: 2 });
  });

  it("are kept apart per user, because families share one phone", () => {
    savePrayedAt("user-1", { a: 1 });

    expect(loadPrayedAt("user-2")).toEqual({});
  });

  it("start empty when what is stored is not readable", () => {
    storage.setItem("vietcorner.prayer.prayedAt.user-1", "not json");

    expect(loadPrayedAt("user-1")).toEqual({});
  });

  it("ignore entries that are not times", () => {
    storage.setItem("vietcorner.prayer.prayedAt.user-1", JSON.stringify({ a: 1, b: "soon", c: null }));

    expect(loadPrayedAt("user-1")).toEqual({ a: 1 });
  });

  it("start empty when storage is unavailable", () => {
    vi.stubGlobal("window", {});

    expect(loadPrayedAt("user-1")).toEqual({});
    expect(() => savePrayedAt("user-1", { a: 1 })).not.toThrow();
  });
});
