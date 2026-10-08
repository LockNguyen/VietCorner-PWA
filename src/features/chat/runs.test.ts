import { describe, expect, it } from "vitest";
import { intoRuns, QUIET_GAP_MS } from "./runs";
import type { Message } from "./types";

const START = Date.parse("2026-10-14T23:00:00Z");
let nextId = 1;

function message(senderId: string, msAfterStart: number): Message {
  return {
    id: nextId++,
    group_id: "g",
    sender_id: senderId,
    sender_email: `${senderId}@example.com`,
    body: "hello",
    created_at: new Date(START + msAfterStart).toISOString(),
  };
}

// What the screen will draw, in a form short enough to read: "time", or "<sender>x<how many>".
const shape = (messages: Message[]) =>
  intoRuns(messages).map((item) => (item.kind === "time" ? "time" : `${item.senderId}x${item.messages.length}`));

describe("a conversation drawn as runs", () => {
  it("is empty for no messages", () => {
    expect(intoRuns([])).toEqual([]);
  });

  it("starts with the time of its first message", () => {
    expect(shape([message("an", 0)])).toEqual(["time", "anx1"]);
  });

  it("keeps one sender's consecutive messages in one run", () => {
    expect(shape([message("an", 0), message("an", 1000), message("an", 2000)])).toEqual(["time", "anx3"]);
  });

  it("starts a new run when the sender changes, and again when the first one answers", () => {
    expect(shape([message("an", 0), message("binh", 1000), message("an", 2000)])).toEqual(["time", "anx1", "binhx1", "anx1"]);
  });

  it("shows the time again after an hour of silence, even inside one sender's run", () => {
    expect(shape([message("an", 0), message("an", QUIET_GAP_MS)])).toEqual(["time", "anx1", "time", "anx1"]);
  });

  it("shows no time just short of an hour", () => {
    expect(shape([message("an", 0), message("an", QUIET_GAP_MS - 1)])).toEqual(["time", "anx2"]);
  });

  it("measures the silence from the previous message, not from the last time shown", () => {
    const messages = [message("an", 0), message("an", QUIET_GAP_MS - 1), message("an", 2 * QUIET_GAP_MS - 2)];

    expect(shape(messages)).toEqual(["time", "anx3"]);
  });
});
