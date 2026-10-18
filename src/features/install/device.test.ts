import { describe, expect, it } from "vitest";
import { deviceOf, hasGlassToolbar } from "./device";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36";
const ZALO = `${ANDROID} Zalo android/12345`;
const FACEBOOK = `${IPHONE} [FBAN/FBIOS;FBAV/450.0]`;

describe("which install instructions fit", () => {
  it("is none once opened from the Home Screen, whatever the phone", () => {
    expect(deviceOf(IPHONE, true, 5)).toBe("installed");
    expect(deviceOf(ZALO, true, 5)).toBe("installed");
  });

  it("is 'open a real browser' inside a chat app's browser", () => {
    expect(deviceOf(ZALO, false, 5)).toBe("inApp");
    expect(deviceOf(FACEBOOK, false, 5)).toBe("inApp");
  });

  it("is the Share menu on an iPhone, and on an iPad, which calls itself a Mac", () => {
    expect(deviceOf(IPHONE, false, 5)).toBe("iphone");
    expect(deviceOf(IPAD, false, 5)).toBe("iphone");
  });

  it("is a computer for a real Mac, which has no touch screen", () => {
    expect(deviceOf(IPAD, false, 0)).toBe("other");
  });

  it("is Chrome's menu on Android", () => {
    expect(deviceOf(ANDROID, false, 5)).toBe("android");
  });
});

describe("the iPhone's new Safari, where Share is behind •••", () => {
  it("is iOS 26 and later, read from Safari's own version", () => {
    const IOS_26 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1";
    expect(hasGlassToolbar(IOS_26)).toBe(true);
    expect(hasGlassToolbar(IPHONE)).toBe(false); // Version/18.0
    expect(hasGlassToolbar(ANDROID)).toBe(false); // no Version at all
  });
});
