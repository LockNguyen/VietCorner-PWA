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

  it("is the link when it is too old or already used", () => {
    expect(problemWith({ status: 403, code: "otp_expired" })).toBe("badLink");
  });

  it("is the address when Supabase will not accept it", () => {
    expect(problemWith({ status: 400, code: "email_address_invalid" })).toBe("badEmail");
    expect(problemWith({ status: 400, code: "validation_failed" })).toBe("badEmail");
  });

  it("is the password when the address and password do not match an account", () => {
    expect(problemWith({ status: 400, code: "invalid_credentials" })).toBe("wrongPassword");
  });

  it("names each password rule Supabase can refuse", () => {
    expect(problemWith({ status: 422, code: "weak_password" })).toBe("weakPassword");
    expect(problemWith({ status: 422, code: "same_password" })).toBe("samePassword");
  });

  it("is the confirmation email when signing in before its link was tapped", () => {
    expect(problemWith({ status: 400, code: "email_not_confirmed" })).toBe("notConfirmed");
  });

  it("is an existing account, whether Supabase says so or signUp hid it (api.ts)", () => {
    expect(problemWith({ status: 422, code: "email_exists" })).toBe("alreadyRegistered");
    expect(problemWith({ code: "user_already_exists" })).toBe("alreadyRegistered");
  });

  it("is something else for anything unrecognised, including nothing at all", () => {
    expect(problemWith({ status: 500, code: "unexpected_failure" })).toBe("other");
    expect(problemWith(new Error("boom"))).toBe("other");
    expect(problemWith(undefined)).toBe("other");
  });
});
