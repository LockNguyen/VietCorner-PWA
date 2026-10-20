import { describe, expect, it } from "vitest";
import { deviceOf, firstButtonAt, hasGlassToolbar } from "./device";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36";
const ZALO = `${ANDROID} Zalo android/12345`;
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0 Mobile/15E148 Safari/604.1";
const IOS_26 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1";
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

  it("is Chrome's own steps for Chrome on an iPhone", () => {
    expect(deviceOf(IPHONE_CHROME, false, 5)).toBe("iphoneChrome");
  });

  it("is Chrome's menu on Android", () => {
    expect(deviceOf(ANDROID, false, 5)).toBe("android");
  });
});

describe("the iPhone's new Safari, where Share is behind •••", () => {
  it("is iOS 26 and later, read from Safari's own version", () => {
    expect(hasGlassToolbar(IOS_26)).toBe(true);
    expect(hasGlassToolbar(IPHONE)).toBe(false); // Version/18.0
    expect(hasGlassToolbar(ANDROID)).toBe(false); // no Version at all
  });
});

describe("where the arrow points", () => {
  it("is the middle of the bottom toolbar in Safari before iOS 26", () => {
    expect(firstButtonAt("iphone", IPHONE, 5)).toBe("bottom");
  });

  it("is ••• at the bottom right in iOS 26 Safari", () => {
    expect(firstButtonAt("iphone", IOS_26, 5)).toBe("bottomRight");
  });

  it("is the top right on an iPad, in Chrome on an iPhone, and on Android", () => {
    expect(firstButtonAt("iphone", IPAD, 5)).toBe("topRight");
    expect(firstButtonAt("iphoneChrome", IPHONE_CHROME, 5)).toBe("topRight");
    expect(firstButtonAt("android", ANDROID, 5)).toBe("topRight");
  });

  it("is nowhere on a computer or in a chat app's browser", () => {
    expect(firstButtonAt("other", IPAD, 0)).toBeNull();
    expect(firstButtonAt("inApp", ZALO, 5)).toBeNull();
  });
});
