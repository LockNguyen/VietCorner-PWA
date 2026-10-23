import { describe, expect, it } from "vitest";
import { isId } from "./ids";

describe("a database id", () => {
  it("is a UUID", () => {
    expect(isId("e657e84b-ec7c-4fc2-8b42-d8543c716949")).toBe(true);
    expect(isId("E657E84B-EC7C-4FC2-8B42-D8543C716949")).toBe(true);
  });

  it("is not anything else", () => {
    expect(isId("x")).toBe(false);
    expect(isId("e657e84b-ec7c-4fc2-8b42-d8543c71694")).toBe(false);
    expect(isId(42)).toBe(false);
    expect(isId(undefined)).toBe(false);
  });
});
