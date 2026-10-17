import { describe, expect, it } from "vitest";
import { dialable } from "./phone";

describe("a phone number for the call and text links", () => {
  it("keeps the digits only", () => {
    expect(dialable("(336) 555-0101")).toBe("3365550101");
    expect(dialable(" 336.555.0101 ")).toBe("3365550101");
  });

  it("keeps a leading + for a number from abroad", () => {
    expect(dialable("+84 90 123 4567")).toBe("+84901234567");
  });
});
