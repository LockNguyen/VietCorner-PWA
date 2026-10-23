import { describe, expect, it } from "vitest";
import { backTarget, detourOf, directionOf, isMain, isStepAside, restoresScroll, sectionOf } from "./navigation";

describe("what kind of screen an address is", () => {
  it("knows the main screens, Staff among them", () => {
    expect(isMain("/")).toBe(true);
    expect(isMain("/staff")).toBe(true);
    expect(isMain("/groups/7/about")).toBe(false);
    expect(isMain("/admin")).toBe(true); // the user, 2026-10-22
    expect(isMain("/admin/people/1")).toBe(false);
    expect(isMain("/settings")).toBe(false);
  });

  it("knows the detours and what is under them, query or not", () => {
    expect(detourOf("/settings/name")).toBe("/settings");
    expect(detourOf("/assistant")).toBe("/assistant");
    expect(detourOf("/admin/analytics?days=7")).toBeNull(); // Admin is a main screen
    expect(detourOf("/groups")).toBeNull();
    expect(detourOf("/settingsx")).toBeNull(); // a prefix is not enough
  });
});

describe("how the screen moves", () => {
  it("switches between two main screens, whatever was tapped", () => {
    expect(directionOf("/events", "/groups", "tab")).toBe("switch");
    expect(directionOf("/", "/staff", "open")).toBe("switch"); // a Home tile
    expect(directionOf("/staff", "/", "back")).toBe("switch"); // Staff's back arrow
    expect(directionOf("/groups", "/admin", "tab")).toBe("switch");
  });

  it("slides an inner screen in when opened, and out by its back arrow", () => {
    expect(directionOf("/groups", "/groups/7/about", "open")).toBe("forward");
    expect(directionOf("/groups/7/about", "/groups", "back")).toBe("back");
    expect(directionOf("/events/new", "/events/manage", "back")).toBe("back");
  });

  it("slides a detour in, and away again whichever tab is tapped", () => {
    expect(directionOf("/groups", "/settings", "open")).toBe("forward");
    expect(directionOf("/settings", "/groups", "tab")).toBe("back");
    expect(directionOf("/settings/name", "/events", "tab")).toBe("back");
    expect(directionOf("/settings", "/assistant", "open")).toBe("forward"); // one detour to another
  });

  it("slides Admin's own inner screens like any other", () => {
    expect(directionOf("/admin", "/admin/people/1", "open")).toBe("forward");
    expect(directionOf("/admin/people/1", "/admin", "tab")).toBe("back");
  });

  it("slides an inner screen away when the bar opens a main screen", () => {
    expect(directionOf("/groups/7/about", "/groups", "tab")).toBe("back");
    expect(directionOf("/groups/7/about", "/events", "tab")).toBe("back");
  });

  it("does not move for the screen already open", () => {
    expect(directionOf("/events", "/events", "tab")).toBeNull();
    expect(directionOf("/admin/analytics", "/admin/analytics?days=7", "tab")).toBeNull();
  });
});

describe("a step aside", () => {
  it("knows each screen's section: its detour, or the main screen it sits under", () => {
    expect(sectionOf("/groups/7/about")).toBe("/groups");
    expect(sectionOf("/settings/name")).toBe("/settings");
    expect(sectionOf("/admin/people/1")).toBe("/admin");
    expect(sectionOf("/")).toBe("/");
  });

  it("is a screen opened from another section, not a main one", () => {
    expect(isStepAside("/events", "/groups/7/about")).toBe(true); // a group from the Events card
    expect(isStepAside("/groups/3/about", "/settings")).toBe(true); // Settings from anywhere
    expect(isStepAside("/groups", "/groups/7/about")).toBe(false); // from its own section
    expect(isStepAside("/events", "/groups")).toBe(false); // a main screen
    expect(isStepAside("/settings", "/settings/name")).toBe(false); // deeper in the same detour
  });
});

describe("where the back arrow leads", () => {
  const fromEvents = { from: "/events", to: "/groups/7/about" };

  it("takes the screen a step aside opened back to where it was opened from", () => {
    expect(backTarget("/groups/7/about", "/groups", fromEvents)).toBe("/events");
    expect(backTarget("/settings", "/", { from: "/groups/3/about", to: "/settings" })).toBe("/groups/3/about");
  });

  it("takes every other screen to its own back address, opened cold too", () => {
    expect(backTarget("/groups/8/about", "/groups", fromEvents)).toBe("/groups"); // another group
    expect(backTarget("/settings/name", "/settings", { from: "/groups", to: "/settings" })).toBe("/settings");
    expect(backTarget("/assistant", "/", null)).toBe("/");
  });
});

describe("when a screen comes back where it was left", () => {
  const fromGroups = { from: "/groups", to: "/settings" };

  it("always for the back arrow and the swipe", () => {
    expect(restoresScroll("back", "/groups/7/about", "/groups", null)).toBe(true);
  });

  it("for the bottom bar only when leaving a step aside for the screen it started from", () => {
    expect(restoresScroll("tab", "/settings", "/groups", fromGroups)).toBe(true);
    expect(restoresScroll("tab", "/settings/name", "/groups", fromGroups)).toBe(true); // deeper, same detour
    expect(restoresScroll("tab", "/settings", "/events", fromGroups)).toBe(false);
    expect(restoresScroll("tab", "/events", "/groups", fromGroups)).toBe(false); // not leaving it
    expect(restoresScroll("open", "/settings", "/groups", fromGroups)).toBe(false);
  });
});
