import { describe, expect, it } from "vitest";
import { stripCitations } from "./speech";

describe("stripCitations", () => {
  it("removes the numbers a listener would hear as 'open bracket one'", () => {
    expect(stripCitations("Tình nguyện viên cần kiểm tra lý lịch [1].")).toBe(
      "Tình nguyện viên cần kiểm tra lý lịch.",
    );
  });

  it("removes several citations in a row", () => {
    expect(stripCitations("Yes [1][2] and no [3].")).toBe("Yes and no.");
  });

  it("leaves an answer without citations alone", () => {
    expect(stripCitations("Xin chào!")).toBe("Xin chào!");
  });

  it("keeps square brackets that are not citations", () => {
    expect(stripCitations("Group [A] meets on Sunday.")).toBe("Group [A] meets on Sunday.");
  });
});
