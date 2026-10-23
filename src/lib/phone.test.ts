import { describe, expect, it } from "vitest";
import { dialable, formatPhone } from "./phone";

describe("a phone number for the call and text links", () => {
  it("keeps the digits only", () => {
    expect(dialable("(336) 555-0101")).toBe("3365550101");
    expect(dialable(" 336.555.0101 ")).toBe("3365550101");
  });

  it("keeps a leading + for a number from abroad", () => {
    expect(dialable("+84 90 123 4567")).toBe("+84901234567");
  });
});

describe("a phone number as it is typed", () => {
  it("takes digits only", () => {
    expect(formatPhone("33a6-")).toBe("336");
  });

  it("adds the brackets, the space and the dash as the digits arrive", () => {
    expect(formatPhone("3361")).toBe("(336) 1");
    expect(formatPhone("336123")).toBe("(336) 123");
    expect(formatPhone("3361234567")).toBe("(336) 123-4567");
  });

  it("stops at ten digits, and reshapes a number pasted in any shape", () => {
    expect(formatPhone("33612345678")).toBe("(336) 123-4567");
    expect(formatPhone("336.123.4567")).toBe("(336) 123-4567");
  });

  it("drops the country code of a number copied with it", () => {
    expect(formatPhone("+1 (336) 123-4567")).toBe("(336) 123-4567");
    expect(formatPhone("1")).toBe("");
  });

  it("lets a deletion go back past the bracket", () => {
    expect(formatPhone("(336) ")).toBe("336");
  });
});
