import { describe, expect, it } from "vitest";
import { backTarget, detourOf, directionOf, isMain, nextTrail, restoresScroll, resumedTrail } from "./navigation";

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

describe("the trail of screens", () => {
  // Follows a list of moves from a fresh start, as the app does.
  const walk = (...moves: [string, "open" | "back"][]) => moves.reduce((trail, [path, step]) => nextTrail(trail, path, step), [] as string[]);

  it("starts again at every main screen", () => {
    expect(walk(["/prayer", "open"], ["/prayer/new", "open"], ["/events", "open"])).toEqual(["/events"]);
  });

  it("pushes what is opened and pops on the way back: Prayer → new → assistant → back → back (the user's bug)", () => {
    const atAssistant = walk(["/prayer", "open"], ["/prayer/new", "open"], ["/assistant", "open"]);
    expect(atAssistant).toEqual(["/prayer", "/prayer/new", "/assistant"]);
    const backAtNew = nextTrail(atAssistant, "/prayer/new", "back");
    expect(backTarget("/prayer/new", "/prayer", backAtNew)).toBe("/prayer");
  });

  it("pops for a move to the screen before, however it was made (a save that returns to the list)", () => {
    const atEditor = walk(["/admin", "open"], ["/admin/translations", "open"], ["/admin/translations/1", "open"]);
    expect(nextTrail(atEditor, "/admin/translations", "open")).toEqual(["/admin", "/admin/translations"]);
  });

  it("replaces the last screen on a back step the trail cannot pop (a screen opened cold)", () => {
    const cold = walk(["/groups/7/photos", "open"], ["/groups/7/about", "back"]);
    expect(cold).toEqual(["/groups/7/about"]);
    expect(backTarget("/groups/7/about", "/groups", cold)).toBe("/groups");
  });

  it("keeps the same screen once, and at most twenty", () => {
    expect(walk(["/groups", "open"], ["/groups/7/about", "open"], ["/groups/7/about?x=1", "open"])).toEqual(["/groups", "/groups/7/about"]);
    const long = Array.from({ length: 30 }, (_, i) => [`/groups/${i}/about`, "open"] as [string, "open"]);
    expect(walk(...long)).toHaveLength(20);
  });

  it("resumes the kept trail only on the screen it ended on", () => {
    expect(resumedTrail(["/events", "/groups/7/about"], "/groups/7/about")).toEqual(["/events", "/groups/7/about"]);
    expect(resumedTrail(["/events", "/groups/7/about"], "/events/3")).toEqual(["/events/3"]); // from a notification
  });
});

describe("where the back arrow leads", () => {
  it("to the screen it was opened from: a group from the Events card, Settings from a group", () => {
    expect(backTarget("/groups/7/about", "/groups", ["/events", "/groups/7/about"])).toBe("/events");
    expect(backTarget("/settings", "/", ["/groups", "/groups/3/about", "/settings"])).toBe("/groups/3/about");
  });

  it("to the screen's own back address when the trail does not know where it came from", () => {
    expect(backTarget("/assistant", "/", ["/assistant"])).toBe("/");
    expect(backTarget("/groups/8/about", "/groups", ["/events", "/groups/7/about"])).toBe("/groups"); // not on show
  });
});

describe("when a screen comes back where it was left", () => {
  it("always for the back arrow and the swipe", () => {
    expect(restoresScroll("back", "/groups", [])).toBe(true);
  });

  it("for the bottom bar only for the main screen the trail started from, when deeper in it", () => {
    expect(restoresScroll("tab", "/groups", ["/groups", "/settings"])).toBe(true);
    expect(restoresScroll("tab", "/groups", ["/groups", "/settings", "/settings/name"])).toBe(true);
    expect(restoresScroll("tab", "/events", ["/groups", "/settings"])).toBe(false);
    expect(restoresScroll("tab", "/groups", ["/groups"])).toBe(false); // already there
    expect(restoresScroll("open", "/groups", ["/groups", "/settings"])).toBe(false);
  });
});
