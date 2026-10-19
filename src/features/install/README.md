# install

Explains how to put the app on the Home Screen, in the steps that fit the visitor's phone, before the
setup starts. No data, no server code.

System docs: `.claude/architecture.md`.

## Files
| Layer | File | Job |
|---|---|---|
| Text | `strings.ts` | Every word of the guide, menu names quoted as the phone shows them |
| Pure logic | `device.ts` | `deviceOf(userAgent, standalone, touchPoints)`: installed, inApp, iphone, android, other |
| State | `hooks/useInstall.ts` | Reads the device; holds Chrome's install prompt; "Continue in this browser" |
| UI | `components/InstallGate.tsx` | The guide until the app runs from the Home Screen, then its children |
| UI | `components/InstallGuide.tsx` | Full screen (no tab bar): logo, bold heading, then a one-tap Install button or the steps |
| UI | `components/InstallStep.tsx` | One instruction: the button to look for in a grey circle (`ui/RoundIcon`), a few words |
| Shell | `src/app/login/page.tsx` | `<InstallGate><Welcome /></InstallGate>` (line marked `INSTALL`) |

## Flow
- Opened from the Home Screen (`display-mode: standalone`, or the iPhone's `navigator.standalone`) → setup.
- **Android / computer with Chrome:** Chrome raises `beforeinstallprompt`; we hold it and show one
  "Install the app" button that opens Chrome's dialog. After it: "Installed — open Viet Corners from your Home Screen."
- **Android without the prompt:** ⋮ → "Install app" / "Add to Home screen".
- **iPhone / iPad:** Share (inside ⋯ on newer Safari) → "Add to Home Screen" → "Add". No page can press it for them.
- **Inside Zalo, Facebook, Messenger, Instagram, Line:** these cannot install; "Open in browser" first.
- **Computer:** "Open this address on your phone", and "Continue in this browser" (remembered on the device).

## Decisions worth knowing
- **Only a computer may skip the guide.** On a phone the installed app is what makes notifications work on
  iPhone and keeps the sign-in apart from the browser's. A phone in a browser tab always sees the guide.
- **Device by user agent:** the one place the app reads it. Tested in `device.test.ts`. An iPad reports
  itself as a Mac; only touch support tells them apart.
- **`/login/confirm` is not wrapped:** on an iPhone the email link opens in Safari, which is not installed.

## Expected behavior
- Observed 2026-10-14 (dev server, 375 px, Android emulated): the Vietnamese guide, "English" at the top
  right, three numbered steps with the ⋮ icon. Desktop Chrome emulation fires no install prompt in the pane.
- A spinner shows for a moment first: the server cannot know how the page was opened.
- **Not exercised:** a real iPhone, a real Android install prompt, Zalo's browser.

## Edge cases
- `beforeinstallprompt` can fire before the guide mounts; then the numbered steps show instead of the button.
- After installing on Android the tab stays open; it says to open the app from the Home Screen.

## Remove
Delete this folder and the `INSTALL` line in `src/app/login/page.tsx` (keep `<Welcome />`).

## After sign-in, with a way out (2026-10-14)
The guide now comes after signing in (the root layout wraps signed-in pages in `InstallGate`; the auth
README, "Safari first"). Since it takes the place of every page, Settings included, it ends with "Sign out"
(`footer`, the auth feature's `SignOutButton` as a link): without it, someone signed in with the wrong
account in Safari was stuck on the guide (found on the iPhone, 2026-10-14). NOT seen on screen: the guide
only shows signed in, which cannot be done in the preview.

## The clean look (2026-10-17, the user)
- The guide covers the whole screen (`fixed`, above the tab bar), in the calm shape of the sign-in screens: the
  bar for a new member, "English" at the top right, then centred the logo, a bold heading and short lines.
- **No numbers:** each step shows the button to look for in a light grey circle, as the iPhone draws them
  (`ui/RoundIcon`): iPhone `Share` → `SquarePlus` "Add to Home Screen" → "Thêm"; Android ⋮ → "Install app".
- **iOS 26 Safari** ("Liquid Glass") hides Share behind •••: then a first step "Tap ••• at the bottom" is added.
  Detected by `hasGlassToolbar` (device.ts, tested) from Safari's "Version/26", because iOS 26 still reports an
  older system version.
- **No sign-out under the guide any more** (the user). This undoes the 2026-10-14 way out: someone signed in to
  the wrong account in Safari must clear Safari's website data, or install and sign out in Settings.
- Only a computer may "Continue in this browser".
- Seen on a local production build as Android at 375 px. NOT seen: the iPhone steps (the preview cannot pose
  as an iPhone), iOS 26 on a real phone.
