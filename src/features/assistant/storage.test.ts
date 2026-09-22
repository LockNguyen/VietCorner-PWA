import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMessages, loadMessages, saveMessages } from "./storage";
import type { ChatMessage } from "./types";

// A stand-in for the browser's localStorage, so these tests need no DOM.
function fakeStorage() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
  };
}

const message = (id: string): ChatMessage => ({ id, role: "user", text: `question ${id}`, status: "done" });

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: fakeStorage() });
});

describe("the stored conversation", () => {
  it("comes back the way it was saved", () => {
    saveMessages("user-1", [message("a"), message("b")]);

    expect(loadMessages("user-1").map((stored) => stored.id)).toEqual(["a", "b"]);
  });

  it("is kept apart per user, because families share one phone", () => {
    saveMessages("user-1", [message("a")]);

    expect(loadMessages("user-2")).toEqual([]);
  });

  it("keeps only the most recent messages", () => {
    saveMessages("user-1", Array.from({ length: 60 }, (_, index) => message(String(index))));

    const stored = loadMessages("user-1");
    expect(stored).toHaveLength(50);
    expect(stored[0].id).toBe("10"); // the oldest ten were dropped
  });

  it("starts empty instead of crashing when the stored data is unreadable", () => {
    window.localStorage.setItem("vietcorner.assistant.user-1", "{not json");

    expect(loadMessages("user-1")).toEqual([]);
  });

  it("survives storage being unavailable, as in private browsing", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });

    expect(() => saveMessages("user-1", [message("a")])).not.toThrow();
    expect(loadMessages("user-1")).toEqual([]);
    expect(() => clearMessages("user-1")).not.toThrow();
  });

  it("is forgotten when the user starts a new chat", () => {
    saveMessages("user-1", [message("a")]);

    clearMessages("user-1");

    expect(loadMessages("user-1")).toEqual([]);
  });
});
