import { describe, expect, it } from "vitest";
import { nextRound } from "./playlist";

const SONGS = ["a", "b", "c", "d", "e", "f"];

describe("the worship songs' order", () => {
  it("plays every song once in a round", () => {
    expect([...nextRound(SONGS, null)].sort()).toEqual(SONGS);
    expect([...nextRound(SONGS, "c")].sort()).toEqual(SONGS);
  });

  it("keeps at least two songs between the end of a round and that song again", () => {
    for (let run = 0; run < 200; run++) {
      expect(nextRound(SONGS, "f").indexOf("f")).toBeGreaterThanOrEqual(2);
    }
  });

  it("can still put that song anywhere from there to the end", () => {
    expect(nextRound(SONGS, "f", () => 0).indexOf("f")).toBe(2);
    expect(nextRound(SONGS, "f", () => 0.999).indexOf("f")).toBe(5);
  });

  it("plays one song over and over when there is only one", () => {
    expect(nextRound(["a"], "a")).toEqual(["a"]);
  });

  it("keeps what gap it can with two songs", () => {
    expect(nextRound(["a", "b"], "a")).toEqual(["b", "a"]);
  });
});
