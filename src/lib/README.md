# src/lib

Code that more than one feature needs and that belongs to none: the Supabase clients, church time, and the
hooks behind every button. The short comment in each file says what it is; the longer reasons are here.

| File | Job |
|---|---|
| `supabase/` | The only Supabase clients: `client.ts` (browser), `server.ts` (server), `admin.ts` (service role, server-only) |
| `churchTime.ts` | The wall clock in Winston-Salem; every date the app schedules by |
| `usePending.ts` | Which action of a component is running; ignores a second tap |
| `useWhenDrawn.ts` | Starts a router change and resolves when its result is on screen |
| `useRefresh.ts`, `useGoTo.ts` | A reload, a move to another screen, each awaited until drawn |
| `useSave.ts` | The usual change from tap to result: pending, the change, reload, a banner |
| `useBanner.tsx` | The banners on screen; raise one from anywhere |
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
