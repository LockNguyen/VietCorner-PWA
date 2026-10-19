// Which install instructions fit this phone. Pure, so every case is tested without a phone.

export type Device =
  | "installed" // already opened from the Home Screen: nothing to explain
  | "inApp" // inside Zalo, Facebook, Messenger…: these cannot install anything, so open a real browser first
  | "iphone" // Safari's Share menu → Add to Home Screen (no button can do it for them)
  | "android" // Chrome can show its own Install prompt, or its ⋮ menu
  | "other"; // a computer, or anything we do not recognise

// why: links are mostly shared in chat apps, and their built-in browsers name themselves in the user agent.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Zalo|Line\//i;

export function deviceOf(userAgent: string, standalone: boolean, touchPoints: number): Device {
  if (standalone) return "installed";
  if (IN_APP.test(userAgent)) return "inApp";
  // An iPad says "Macintosh" like a Mac; only its touch screen tells them apart.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) return "iphone";
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
