import { describe, expect, it } from "vitest";
import { AssistantError, causeForStatus, ERRORS } from "./errors";
import type { ErrorCause } from "./types";

const ALL_CAUSES: ErrorCause[] = ["offline", "timeout", "unauthorized", "invalid", "busy", "server"];

describe("causeForStatus", () => {
  it("separates our mistakes from the service being unavailable", () => {
    expect(causeForStatus(401)).toBe("unauthorized");
    expect(causeForStatus(400)).toBe("invalid");
    expect(causeForStatus(413)).toBe("invalid");
    expect(causeForStatus(422)).toBe("invalid");
    expect(causeForStatus(503)).toBe("busy");
    expect(causeForStatus(500)).toBe("server");
  });

  it("treats an unexpected status as a server fault, which can be retried", () => {
    expect(ERRORS[causeForStatus(418)].retryable).toBe(true);
  });
});

describe("the error table", () => {
  it("has both languages for every cause", () => {
    for (const cause of ALL_CAUSES) {
      expect(ERRORS[cause].message.en).not.toBe("");
      expect(ERRORS[cause].message.vi).not.toBe("");
    }
  });

  it("offers a retry only where trying again could work", () => {
    // Retrying an expired session or a malformed question sends exactly the same failing request.
    expect(ERRORS.unauthorized.retryable).toBe(false);
    expect(ERRORS.invalid.retryable).toBe(false);
    expect(ERRORS.offline.retryable).toBe(true);
    expect(ERRORS.timeout.retryable).toBe(true);
    expect(ERRORS.busy.retryable).toBe(true);
  });
});

describe("AssistantError", () => {
  it("carries the cause, which is what the screen renders from", () => {
    const error = new AssistantError("busy");

    expect(error.cause).toBe("busy");
    expect(ERRORS[error.cause].message.vi).toMatch(/bận/);
  });
});
