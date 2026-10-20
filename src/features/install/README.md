# install

Explains how to put the app on the Home Screen, in the steps that fit the visitor's phone, before the
setup starts. No data, no server code.

System docs: `.claude/architecture.md`.

## Files
| Layer | File | Job |
|---|---|---|
| Text | `strings.ts` | Every word of the guide, menu names quoted as the phone shows them |
| Pure logic | `device.ts` | `deviceOf(userAgent, standalone, touchPoints)`: installed, inApp, iphone, iphoneChrome, android, other; `firstButtonAt`: where the browser's first button is (bottom, bottom right, top right) |
| State | `hooks/useInstall.ts` | Reads the device and where its first button is; holds Chrome's install prompt; "Continue in this browser" |
| UI | `components/InstallGate.tsx` | The guide until the app runs from the Home Screen, then its children. With `askLanguage` (on `/login`), i18n's `LanguageChoice` first |
| UI | `components/ShareArrow.tsx` | A big bouncing arrow at the screen's edge, pointing at the browser's Share (or ⋮) button |
| UI | `components/InstallGuide.tsx` | Full screen (no tab bar): logo, bold heading, then a one-tap Install button or the steps |
| UI | `components/InstallStep.tsx` | One instruction: the button to look for in a grey circle (`ui/RoundIcon`), a few words |
| Shell | `src/app/login/page.tsx` | `<InstallGate askLanguage><Welcome /></InstallGate>` (lines marked `INSTALL`) |
| Shell | `src/app/layout.tsx` | Wraps signed-in pages in `InstallGate` too (line marked `INSTALL`) |

## Flow
- Opened from the Home Screen (`display-mode: standalone`, or the iPhone's `navigator.standalone`) → setup.
- **Android / computer with Chrome:** Chrome raises `beforeinstallprompt`; we hold it and show one
  "Install the app" button that opens Chrome's dialog. After it: "Installed — open Viet Corners from your Home Screen."
- **Android without the prompt:** ⋮ → "Install app" / "Add to Home screen".
- **iPhone / iPad:** Share (inside ⋯ on newer Safari) → "Add to Home Screen" → "Add". No page can press it for them.
- **Chrome on an iPhone:** Share at the top right (in the address bar) → "Add to Home Screen" → "Add".
- **Inside Zalo, Facebook, Messenger, Instagram, Line:** these cannot install; "Open in browser" first.
- **Computer:** "Open this address on your phone", and "Continue in this browser" (remembered on the device).

## Decisions worth knowing
- **Only a computer may skip the guide.** On a phone the installed app is what makes notifications work on
  iPhone and keeps the sign-in apart from the browser's. A phone in a browser tab always sees the guide.
- **Device by user agent:** the one place the app reads it. Tested in `device.test.ts`. An iPad reports
  itself as a Mac; only touch support tells them apart.
- **`/login/confirm` is not wrapped:** on an iPhone the email link opens in Safari, which is not installed.
- **The arrow only points:** the phone's own Add to Home Screen sheet covers the page, so the page leads the eye
  as far as the first button (the user, 2026-10-20). Where it is: Safari before iOS 26, the middle of the bottom
  toolbar; iOS 26 Safari, ••• at the bottom right; an iPad, Chrome on an iPhone, Android: the top right (the
  language link then moves to the left, out of its way).

## Expected behavior
- Observed 2026-10-14 (dev server, 375 px, Android emulated): the Vietnamese guide, "English" at the top
  right, three numbered steps with the ⋮ icon. Desktop Chrome emulation fires no install prompt in the pane.
- A spinner shows for a moment first: the server cannot know how the page was opened.
- **Not exercised:** a real iPhone, a real Android install prompt, Zalo's browser.

## Edge cases
- `beforeinstallprompt` can fire before the guide mounts; then the numbered steps show instead of the button.
- After installing on Android the tab stays open; it says to open the app from the Home Screen.

## Remove
Delete this folder, the `INSTALL` lines in `src/app/login/page.tsx` (keep `<Welcome />`) and `src/app/layout.tsx`,
and i18n's `LanguageChoice` if no other screen asks the language.

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

## Install first, sign in inside the app (2026-10-20, the user)
**The report:** a member on iOS < 26 signed up on the website (name, email), tapped the confirmation email,
landed on the install guide, installed, and the app was signed out. The user's own iPhone (iOS < 26) and 17 on
iOS 26 never did this.

**Root cause:** the old order (the "Safari first" section above and the auth README) signed people in in the
browser and relied on iOS copying the sign-in into the app at the moment it is added. iOS copies **regular
Safari's** cookies only. The member's sign-in was made somewhere else, most likely **Chrome on the iPhone**
(also the user's "Chrome users can't install" report; our steps then described Safari's toolbar), or a Safari
**Private** tab. The sequence: sign-up in that browser → the email link opened in the same browser (Chrome as the
default browser, or the Gmail app set to open links in Chrome) → `useConfirmLink` saw this browser's own claim key,
signed it in with no button ("same browser" path) and opened Home → the layout's `InstallGate` showed the guide →
the installed app started with no cookies → signed out. The guide did not hide a "confirm" button: in the same
browser there is none. Why the user never saw it: their phone uses regular Safari, where the copy works. The iOS
version is most likely a coincidence. To confirm on the member's phone: which browser they opened the website in;
or Supabase → Logs → Auth, the `/verify` request at that time: `CriOS` in its user agent is Chrome on an iPhone.

**The fix:** on a phone's browser, `/login` is the language page, then this guide, and nothing else; signing up
and signing in happen inside the installed app, through the hand-off (auth README), which works whatever browser
the email opens in. Nothing depends on iOS copying a sign-in any more. The language is the one thing still carried
over (a cookie): when the copy does not happen the app simply opens in Vietnamese, with "English" at the top right.
Seen in the preview (2026-10-20, Android at 375 px and a computer): the language page in both languages; English →
the English guide with the arrow at the top right and the language link moved left; the server's next page is in
English (cookie); on a computer, "Continue in this browser" → sign-in. NOT seen: the iPhone steps and arrows (the
preview cannot pose as an iPhone; `firstButtonAt` is tested instead), a real Chrome on an iPhone.
