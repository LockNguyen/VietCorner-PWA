# text-size

Two text sizes, chosen per phone (the user, 2026-10-17): **Gọn / Compact**, the app as it was, and
**Chữ to / Big text**, every text about a fifth bigger, for elderly eyes. In Settings, and as the first step of signing
up ("Step 1 / 7"), so a new member can make the app readable before anything else.

System docs: `.claude/architecture.md`.

## Files
| Layer | File | Job |
|---|---|---|
| Types | `types.ts` | `TextSize`, `TEXT_SIZE_COOKIE`, `textSizeOf` (reads the cookie's value) |
| Text | `strings.ts` | The heading and the two choices |
| State | `hooks/useTextSize.ts` | The current size; `choose` sets the cookie and `<html data-text-size>`, then refreshes |
| UI | `components/TextSizeChoice.tsx` | Two rows with a tick, like the language choice |
| Shell | `src/app/layout.tsx` (`TEXT-SIZE` lines) | Reads the cookie: `data-text-size` on `<html>`, and `bigText` for `AppTabs` |
| Shell | `src/app/settings/page.tsx`, `src/app/login/page.tsx` (`TEXT-SIZE` lines) | Show the choice |
| Style | `src/app/globals.css` | `html[data-text-size="big"]` sets `--text-scale: 1.2` |

## How it works
- Every text size in the app is in `rem` over one root size that is multiplied by `--text-scale`
  (`docs/design-system.md`). Big sets it to 1.2: body text goes from 17 to about 20 px. Spacing is in px and
  stays, so screens get fuller rather than wider.
- **A cookie, on this phone only.** The server reads it, so the first screen is already the right size;
  there is no table and nothing to sync. Two people sharing a phone share its size.
- **The tab bar:** with big text, or with the Admin tab showing (five tabs), "Lịch sinh hoạt" reads "Lịch"
  (`SHELL_STRINGS.eventsTabShort`), or it would not fit.

## Expected behavior
- Settings → Cỡ chữ: Gọn (ticked by default) and Chữ to. A tap changes every text at once and survives a reload
  and a sign-out.
- Sign-up's first step shows the same two rows and "Tiếp tục".

## Remove
Delete this folder and the `TEXT-SIZE` lines in `src/app/layout.tsx`, `src/app/settings/page.tsx` and
`src/app/login/page.tsx`. The `--text-scale` rule in `globals.css` can stay (nothing sets it).
