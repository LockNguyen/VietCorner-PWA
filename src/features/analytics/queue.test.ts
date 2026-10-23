import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsEvent } from "./types";

// The queue keeps module state, so each test loads a fresh copy, on a pretend phone: its storage, its network
// state, and a sendBeacon that records what it was given.
let stored: Map<string, string>;
let sent: AnalyticsEvent[][];
let online: boolean;

async function freshQueue() {
  vi.resetModules();
  return import("./queue");
}

beforeEach(() => {
  stored = new Map();
  sent = [];
  online = true;
  vi.stubGlobal("location", { pathname: "/groups" });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  });
  vi.stubGlobal("navigator", {
    get onLine() {
      return online;
    },
    sendBeacon: (_url: string, body: Blob) => {
      void body.text().then((text) => sent.push(JSON.parse(text)));
      return true;
    },
  });
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0)); // the Blob is read asynchronously

describe("when the analytics queue sends", () => {
  it("waits while the app is in use, instead of sending on a timer", async () => {
    const queue = await freshQueue();
    queue.keepFor("ann");
    for (let i = 0; i < 49; i++) queue.record("click");
    await flush();

    expect(sent).toHaveLength(0);
  });

  it("sends as soon as one request's worth (50) has built up", async () => {
    const queue = await freshQueue();
    queue.keepFor("ann");
    for (let i = 0; i < 50; i++) queue.record("click");
    await flush();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toHaveLength(50);
  });

  it("sends everything when the app is put away", async () => {
    const queue = await freshQueue();
    queue.keepFor("ann");
    queue.record("page");
    queue.sendAll();
    await flush();

    expect(sent.flat()).toHaveLength(1);
  });
});

describe("what is never lost", () => {
  it("keeps what an ended app left unsent, and sends it at the next opening", async () => {
    const before = await freshQueue();
    before.keepFor("ann");
    before.record("page");
    before.record("click"); // ...and the app ends here, before being put away

    const after = await freshQueue();
    after.keepFor("ann");
    await flush();

    expect(sent.flat().map((event) => event.kind)).toEqual(["page", "click"]);
  });

  it("holds events while offline, and sends them once back online", async () => {
    const queue = await freshQueue();
    queue.keepFor("ann");
    online = false;
    queue.record("page");
    queue.sendAll();
    await flush();
    expect(sent).toHaveLength(0);

    online = true;
    queue.sendAll();
    await flush();
    expect(sent.flat()).toHaveLength(1);
  });

  it("never sends one person's kept events as another's on a shared phone", async () => {
    const before = await freshQueue();
    before.keepFor("ann");
    online = false;
    before.record("page");

    online = true;
    const after = await freshQueue();
    after.keepFor("bob");
    await flush();

    expect(sent).toHaveLength(0);
  });

  it("does not send kept events twice when told twice", async () => {
    const before = await freshQueue();
    before.keepFor("ann");
    online = false;
    before.record("page");

    const after = await freshQueue();
    after.keepFor("ann");
    after.keepFor("ann");
    online = true;
    after.sendAll();
    await flush();

    expect(sent.flat()).toHaveLength(1);
  });
});
