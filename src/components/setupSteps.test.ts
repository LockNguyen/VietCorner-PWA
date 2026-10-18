import { describe, expect, it } from "vitest";
import { stepsFor } from "./setupSteps";

const FRESH_PHONE = { installed: false, notificationsAnswered: false, canNotify: true };

describe("the setup steps a person will see", () => {
  it("are all of them on a fresh phone", () => {
    expect(stepsFor(FRESH_PHONE, "name")).toEqual(["textSize", "name", "email", "install", "notifications", "waiting", "done"]);
  });

  it("leave out install in the installed app, and notifications answered before on this phone", () => {
    const steps = stepsFor({ installed: true, notificationsAnswered: true, canNotify: true }, "email");
    expect(steps).toEqual(["textSize", "name", "email", "waiting", "done"]);
    expect(steps.indexOf("waiting") + 1).toBe(4); // right after "email" (3), not 6
  });

  it("leave out notifications where the browser cannot receive them", () => {
    expect(stepsFor({ ...FRESH_PHONE, canNotify: false }, "name")).not.toContain("notifications");
  });

  it("always keep the step on screen", () => {
    expect(stepsFor({ installed: true, notificationsAnswered: true, canNotify: false }, "notifications")).toContain("notifications");
  });
});
