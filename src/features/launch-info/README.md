# launch-info

An "i" on Home, for admins only, opening "For developers: this launch": how long this launch took and where
its files came from. For checking a slow launch on the phone itself, with no Mac and no temporary code.
No data, no server code.

System docs: `.claude/architecture.md`.

## Files
| Layer | File | Job |
|---|---|---|
| Text | `strings.ts` | Every word of the panel |
| Pure logic | `launchTimes.ts` | `launchTimes(navigation, resources, tappable, savedHome)`: the numbers; `seconds(ms)` |
| State | `hooks/useLaunchTimes.ts` | Notes when Home first became tappable and whether it was the saved copy; reads the browser's records when the panel opens |
| UI | `components/LaunchInfo.tsx` | The "i" button (where "+" sits on the other tabs) and the sheet |
| Shell | `src/app/page.tsx` (line marked `LAUNCH-INFO`) | Shown only to whoever manages something, like the Admin tile |

## What each number means
All in seconds from when the phone began loading the page.

| Row | Read from | Tells you |
|---|---|---|
| Home came from | the page's age (`isSavedCopy`, `lib/savedHome.ts`) | Saved copy (the service worker's) or the server |
| Page arrived | `responseStart` | Server and network; near 0 for the saved copy |
| Code files read | `domContentLoadedEventEnd` | The page plus its JS/CSS |
| Ready to tap | when Home first appeared after the page load | React has taken over |
| Everything loaded | `loadEventEnd` | Pictures too ("—" while still loading) |
| Code files from the saved copy / downloaded | `/_next/static/*` entries, `transferSize === 0` | Whether the service worker's copy was used |

## Decisions worth knowing
- **The black screen is not counted.** iOS starts the app before the page exists, and no page can see that
  time. Time it with a stopwatch and compare.
- **Admins only is tidiness, not security.** The panel shows times, no personal data; the check is the
  same `managesSomething` as the Admin tile.
- **A saved copy less than a minute old shows as "Server".** The same rule as the refresh (`isSavedCopy`):
  only an old copy needs replacing. After hours away it says "Saved copy".
- **"Ready to tap" is taken the first time Home appears after a page load.** A launch that opens another
  screen first (a notification) gives a later time for it.

## How to remove
Delete this folder and the `LAUNCH-INFO` lines in `src/app/page.tsx`. `isSavedCopy` in `src/lib/savedHome.ts`
stays: `RefreshSavedPage` uses it.
