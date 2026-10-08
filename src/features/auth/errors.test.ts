import { describe, expect, it } from "vitest";
import { problemWith } from "./errors";

describe("why a sign-in step failed", () => {
  it("is the connection when the request never arrived", () => {
    expect(problemWith({ name: "AuthRetryableFetchError", status: 0 })).toBe("offline");
  });

  it("is too many tries when Supabase says to slow down, whichever limit was hit", () => {
    expect(problemWith({ status: 429, code: "over_email_send_rate_limit" })).toBe("tooMany");
    expect(problemWith({ status: 429, code: "over_request_rate_limit" })).toBe("tooMany");
  });

  it("is the code when it is wrong or too old", () => {
    expect(problemWith({ status: 403, code: "otp_expired" })).toBe("badCode");
  });

  it("is the address when Supabase will not accept it", () => {
    expect(problemWith({ status: 400, code: "email_address_invalid" })).toBe("badEmail");
    expect(problemWith({ status: 400, code: "validation_failed" })).toBe("badEmail");
  });

  it("is something else for anything unrecognised, including nothing at all", () => {
    expect(problemWith({ status: 500, code: "unexpected_failure" })).toBe("other");
    expect(problemWith(new Error("boom"))).toBe("other");
    expect(problemWith(undefined)).toBe("other");
  });
});
