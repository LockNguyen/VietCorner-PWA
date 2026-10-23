# src/lib

Code that more than one feature needs and that belongs to none: the Supabase clients, church time, and the
hooks behind every button. The short comment in each file says what it is; the longer reasons are here.

| File | Job |
|---|---|
| `supabase/` | The only Supabase clients: `client.ts` (browser), `server.ts` (server), `admin.ts` (service role, server-only) |
| `switches.ts` | What is switched off for now: one constant per feature or notification, read where it is turned off |
| `churchTime.ts` | The wall clock in Winston-Salem; every date the app schedules by |
| `phone.ts` | `dialable` (digits for the call and text links), `formatPhone` ("(336) 123-4567" as typed, for `ui/PhoneInput`) |
| `screenPictures.ts` | Copies of the screens left behind, shown under the screen during a swipe back (`useSwipeBack`) |
| `ids.ts` | `isId`: whether a route's input is a database id, so a malformed one is answered 400 |
| `aiService.ts` | The one client of the AI service (`services/ai`), server-only: the assistant and prayer's translations |
| `usePending.ts` | Which action of a component is running; ignores a second tap |
| `useWhenDrawn.ts` | Starts a router change and resolves when its result is on screen |
| `useRefresh.ts`, `useGoTo.ts` | A reload, a move to another screen, each awaited until drawn |
| `useSave.ts` | The usual change from tap to result: pending, the change, reload, a banner |
| `useBanner.tsx` | The banners on screen; raise one from anywhere |
| `useOnArrival.ts` | Runs something when a screen is arrived at and when the app returns to the foreground |
| `useFresh.ts` | A list shows what the page loaded, then re-reads itself on arrival and on return to the app |
| `shrinkImage.ts` | A photo → a smaller JPEG, in the browser, before upload; `shrinkToThumbnail` for a row's picture |
| `publicFileUrl.ts` | The address of a file in a public storage bucket (row pictures) |
| `useWhenVisible.ts` | Calls back when an element scrolls into view: "load more" at the end of a list or a strip |
| `useScrollToEnd.ts` | Keeps the newest message of a conversation in view |

## `usePending`: why every button goes through it
A request takes a moment, and a button that looks the same during that moment gets tapped again. Then the
same thing is sent twice: two login codes, two identical events, or a false "could not save" for something
that did save.

```tsx
const { pending, run } = usePending<"save" | "remove">();
<Button pending={pending === "save"} disabled={pending !== null} onClick={() => run("save", save)}>
```

- `run(action, work)` does the work unless something is already running, in which case the tap is ignored.
- `pending` is the name of the running action, or null. The tapped button shows it is busy
  (`pending === "save"`); its siblings are disabled meanwhile (`pending !== null`).
- One instance per row of a list, so a busy row never blocks the rows around it.
- It only tracks. `useSave` builds on it for the usual case: change, reload, say how it went.

## `useWhenDrawn`: why a reload or a move is awaited
`router.refresh()` and `router.push()` return at once and the new screen arrives a moment later. A button
that stops looking busy in between shows its old label for that moment ("Cancel", then "Undo"), which reads
as "nothing happened" and invites a second tap; on a new event, that second tap saved it twice.

React keeps a transition "pending" until the screen it leads to is drawn, so the change is started inside
one, and the promise is resolved when that transition ends. If the change takes the component off the
screen, the promise never resolves, and whatever waited on it simply stays busy until it is gone.

## `useFresh`: why a list refreshes itself instead of the page reloading
The aim is "show the kept copy at once, fetch a fresh one behind it, swap". Next.js can keep a visited page
(`staleTimes`), but its only way to renew one, `router.refresh()`, throws away every kept page, not just the
current one: measured on 2026-10-09, a refresh on one tab made the next two taps fetch again. So the page
is left alone and the list re-reads its own data: once on arrival, and whenever the app returns to the
foreground. `read` is the same call the page made, from the feature's `api.ts`.

`useOnArrival` is the timing alone, for a list that merges what it reads instead of replacing it (the
prayer list keeps older pages the reader has scrolled to).

If a read fails, what is on screen stays. If the page itself loads again (after a save), what it brings
replaces what the list held.

### Why a list remembers what it last showed
A kept copy of a page is frozen: it holds the data the server sent when the page was loaded, and the list's
own refresh cannot change it. Without a memory, every return to the tab started from that old data and then
corrected itself, so something already dealt with flashed up and vanished, every time, for as long as the
copy was kept (seen 2026-10-09: an answered join request on the Admin page). So `useFresh` remembers the
newest value each list has shown and starts from that. The prayer list does the same in its own hook.

What is left: after something changes while you are elsewhere, the first return shows the old value for the
moment the refresh takes, once. And when a kept copy has expired and the server sends a newer page, the
list still starts from its memory for that same moment before the refresh lands.

## `switches.ts`: why "off" is a constant and not a deleted folder
After the pastor's review (2026-10-12) several things had to stop without being lost: chat, joining a group,
most notifications. Each is one `false` in `switches.ts`, read at the door of what it turns off: a page or a
route answers 404 on its first line, a sender returns before sending, a tab is left out of the list.
- **Phones download nothing of an off screen**: its code is only fetched when its page renders, and it never does.
- **The code still compiles and is still type-checked**, so it cannot rot while it is off. The cost is that
  it stays in the server build.
- **The database is untouched.** Off is an app decision; the tables and their rules stay as they were.
- Back on is `true`. Search for the switch's name to see every place it is read.

- `useBanner`: `showBanner({ kind, message, seconds?, action? })`. `action: { label, onAct }` ends the message
  with a link ("Forgot password?"); tapping it puts the banner away and runs `onAct` (2026-10-14).
- `useConfirmTap(action)` (2026-10-14): "tap again to confirm" without a pop-up. The first tap arms it (the
  button's words change to `COMMON.tapAgain` for 4 s), the second runs `action`. For the small red lines.
