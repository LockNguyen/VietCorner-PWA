import { describe, expect, it } from "vitest";
import { nextRetrySeconds } from "./useChatbotMessages";

describe("nextRetrySeconds", () => {
  it("waits two seconds longer after each failure", () => {
    expect(nextRetrySeconds(5)).toBe(7);
    expect(nextRetrySeconds(7)).toBe(9);
  });

  it("stops growing at a minute, where 'busy' has become 'down'", () => {
    expect(nextRetrySeconds(59)).toBe(60);
    expect(nextRetrySeconds(60)).toBe(60);
  });
});
