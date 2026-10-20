// Which install instructions fit this phone. Pure, so every case is tested without a phone.

export type Device =
  | "installed" // already opened from the Home Screen: nothing to explain
  | "inApp" // inside Zalo, Facebook, Messenger…: these cannot install anything, so open a real browser first
  | "iphone" // Safari's Share menu → Add to Home Screen (no button can do it for them)
  | "iphoneChrome" // Chrome on an iPhone: the same menu, but its Share button is at the top, in the address bar
  | "android" // Chrome can show its own Install prompt, or its ⋮ menu
  | "other"; // a computer, or anything we do not recognise

// why: links are mostly shared in chat apps, and their built-in browsers name themselves in the user agent.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Zalo|Line\//i;
// Chrome on iOS calls itself "CriOS"; under it is the same WebKit as Safari, with its own toolbar.
const CHROME_ON_IOS = /CriOS/;

export function deviceOf(userAgent: string, standalone: boolean, touchPoints: number): Device {
  if (standalone) return "installed";
  if (IN_APP.test(userAgent)) return "inApp";
  if (isIos(userAgent, touchPoints)) return CHROME_ON_IOS.test(userAgent) ? "iphoneChrome" : "iphone";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}

// Whether this iPhone's Safari has the "Liquid Glass" look (iOS 26 and later), where the Share button sits
// behind ••• at the bottom right instead of on the toolbar. Read from "Version/26": iOS 26 Safari still reports
// an older system version ("iPhone OS 18_6"), but its own version number is the real one.
export function hasGlassToolbar(userAgent: string): boolean {
  const version = Number(/Version\/(\d+)/.exec(userAgent)?.[1] ?? 0);
  return version >= 26;
}

// Where the button the first step names sits, so an arrow can point at it (the user, 2026-10-20: the phone's
// own Add to Home Screen sheet covers the page, so the page can only lead the way as far as that button).
// null: no arrow (a computer, a chat app's browser, or Chrome's own Install button on screen).
export type ButtonCorner = "bottom" | "bottomRight" | "topRight";

export function firstButtonAt(device: Device, userAgent: string, touchPoints: number): ButtonCorner | null {
  if (device === "iphoneChrome" || device === "android") return "topRight"; // Chrome's Share, or its ⋮
  if (device !== "iphone") return null;
  if (isIpad(userAgent, touchPoints)) return "topRight"; // the iPad's Safari keeps its toolbar at the top
  return hasGlassToolbar(userAgent) ? "bottomRight" : "bottom"; // iOS 26: •••; before: Share, mid-toolbar
}

function isIos(userAgent: string, touchPoints: number): boolean {
  return /iPhone|iPod/.test(userAgent) || isIpad(userAgent, touchPoints);
}

// An iPad says "Macintosh" like a Mac; only its touch screen tells them apart.
function isIpad(userAgent: string, touchPoints: number): boolean {
  return /iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}
