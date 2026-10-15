import { describe, expect, it } from "vitest";
import { attemptOf, isHex64, newClaimKey } from "./handoff";

describe("handing a sign-in to the device that asked", () => {
  it("makes a different secret key every time, in the shape the routes accept", () => {
    const [first, second] = [newClaimKey(), newClaimKey()];

    expect(first).not.toBe(second);
    expect(isHex64(first)).toBe(true);
  });

  it("names a key by its SHA-256, the same on every device, and never by the key itself", async () => {
    // The published SHA-256 of "abc".
    expect(await attemptOf("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

    const key = newClaimKey();
    expect(await attemptOf(key)).toBe(await attemptOf(key));
    expect(await attemptOf(key)).not.toBe(key);
  });

  it("refuses anything that is not 64 hex characters", () => {
    expect(isHex64("abc")).toBe(false);
    expect(isHex64("G".repeat(64))).toBe(false);
    expect(isHex64(`${"a".repeat(64)}; drop table`)).toBe(false);
    expect(isHex64(undefined)).toBe(false);
  });
});
