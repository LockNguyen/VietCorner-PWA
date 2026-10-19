import { describe, expect, it } from "vitest";
import { launchTimes, seconds } from "./launchTimes";

const navigation = { responseStart: 1080, domContentLoadedEventEnd: 21950, loadEventEnd: 22310 };

describe("launchTimes", () => {
  it("counts code files with nothing transferred as saved, the rest as downloaded", () => {
    const resources = [
      { name: "https://x/_next/static/chunks/a.js", transferSize: 0 },
      { name: "https://x/_next/static/chunks/b.js", transferSize: 5200 },
      { name: "https://x/_next/static/css/c.css", transferSize: 0 },
    ];
    const times = launchTimes(navigation, resources, 22540, false);
    expect(times.filesSaved).toBe(2);
    expect(times.filesDownloaded).toBe(1);
  });

  it("counts only code files, not pictures or pages", () => {
    const resources = [
      { name: "https://x/images/home/events.png", transferSize: 90000 },
      { name: "https://x/events?_rsc=abc", transferSize: 0 },
    ];
    const times = launchTimes(navigation, resources, 22540, true);
    expect(times.filesSaved + times.filesDownloaded).toBe(0);
  });

  it("passes the moments of the launch through", () => {
    const times = launchTimes(navigation, [], 22540, true);
    expect(times).toMatchObject({ savedHome: true, pageArrived: 1080, filesRead: 21950, tappable: 22540, allLoaded: 22310 });
  });
});

describe("seconds", () => {
  it("shows two decimals, and a dash for a moment that has not happened", () => {
    expect(seconds(1270)).toBe("1.27 s");
    expect(seconds(0)).toBe("—");
  });
});
