import { describe, expect, it } from "vitest";
import { translate } from "./translate";

const GREETING = { en: "Sign in", vi: "Đăng nhập" };

describe("translate", () => {
  it("returns the chosen language", () => {
    expect(translate(GREETING, "vi")).toBe("Đăng nhập");
    expect(translate(GREETING, "en")).toBe("Sign in");
  });

  it("falls back to the other language instead of showing nothing", () => {
    // A half-translated string must still render a readable button.
    expect(translate({ en: "Save", vi: "" }, "vi")).toBe("Save");
    expect(translate({ en: "", vi: "Lưu" }, "en")).toBe("Lưu");
  });

  it("returns an empty string only when both are empty", () => {
    expect(translate({ en: "", vi: "" }, "en")).toBe("");
  });
});
