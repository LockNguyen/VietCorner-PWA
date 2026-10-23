import { describe, expect, it } from "vitest";
import { shownText } from "./shownText";

const vietnamese = {
  body: "Xin cầu nguyện cho mẹ tôi.",
  language: "vi" as const,
  translation: "Please pray for my mother.",
};

describe("the words a reader sees", () => {
  it("is the approved translation for a reader of the other language", () => {
    expect(shownText(vietnamese, "en")).toBe("Please pray for my mother.");
  });

  it("is the request as written for a reader of its own language", () => {
    expect(shownText(vietnamese, "vi")).toBe("Xin cầu nguyện cho mẹ tôi.");
  });

  it("is the request as written while the translation waits for review (the view sends none)", () => {
    expect(shownText({ ...vietnamese, translation: null }, "en")).toBe("Xin cầu nguyện cho mẹ tôi.");
  });

  it("is the request as written while its language is not known yet", () => {
    expect(shownText({ ...vietnamese, language: null }, "en")).toBe("Xin cầu nguyện cho mẹ tôi.");
  });
});
