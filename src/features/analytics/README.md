# analytics

Who opens which screen, for how long, what they tap and which screen that opens, which errors they run into,
what is slow, and what each visit asks of Supabase. Recorded on every signed-in phone, read by admins on
`/admin/analytics`. Built 2026-10-22 on the user's word.

System docs: `.claude/architecture.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor (safe to run again), after permissions. It schedules the 90-day
cleanup with pg_cron. An admin sees the dashboard after their next token refresh (or sign out and in).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `analytics_events`, its rules, `analytics.view` for admins, the dashboard's reads (`analytics_*`), the nightly cleanup |
| Types | `types.ts` | `AnalyticsEvent`, the report rows, `VIEW_ANALYTICS`, every threshold with its why, the ranges |
| Pure | `usage.ts` | `serviceOf` (which service an address is), `pathOf` (an address without its query), `countRequest` |
| Text | `strings.ts` | Every word of the dashboard, durations and sizes |
| Browser | `queue.ts` | What was recorded and not sent yet (also kept on the phone, per person); the visit id; `record` (sends at 50), `sendAll`, `keepFor` |
| Browser | `trackedFetch.ts` | The Supabase browser client's fetch: notes each failed request with its status |
| Browser API | `api.ts` | `readReport`, `readTimeline` (a list's refresh), `sendEvents`: sendBeacon to the route, 50 events per request; returns what the browser refused |
| Hooks | `hooks/useTapTracking.ts` | Every tap on a control (label, link); keeps the last one |
| Hooks | `hooks/usePageTracking.ts` | Each screen's time on show, where from, by which tap, how long it took, its usage |
| Hooks | `hooks/useResourceUsage.ts` | Requests per service (Resource Timing); each one over 3 s |
| Hooks | `hooks/useErrorTracking.ts` | Errors no code caught |
| Hooks | `hooks/useVitals.ts` | LCP, INP, CLS, TTFB (the `web-vitals` library) |
| Hooks | `hooks/useKeptEvents.ts` | Gives the queue its owner: last time's unsent events go now, and are kept for them from then on |
| Server | `server/recordEvents.ts` | Drops malformed events, stores the rest as the signed-in user |
| Reads | `reads.ts` | One function per dashboard read (`Report`), `getProblems` (the Problems screen's four as one value), a person's timeline |
| Server reads | `server/queries.ts` | The pages' reads: `reads.ts`, re-exported |
| Hooks | `hooks/useFreshReport.ts` | Each dashboard list shows what its page loaded, then reads the same report again on arrival (`useFresh`, 2026-10-22); `useFreshTimeline` for a person |
| UI | `components/ActivityTracker.tsx` | The hooks together; draws nothing |
| UI | `components/*List.tsx`, `ProblemLists.tsx`, `Timeline.tsx`, `RangePicker.tsx`, `ViewLinks.tsx`, `AnalyticsLink.tsx`, `StatSection.tsx` | The dashboard's lists, all `ListRow`s |
| Shell | `src/app/admin/analytics/**`, `src/app/api/analytics/record/route.ts` | Seven screens; the route |

Marked lines elsewhere (`// ANALYTICS`): `src/app/layout.tsx` (the tracker), `src/lib/supabase/client.ts`
(the fetch), `src/lib/useBanner.tsx` (error banners), `src/app/admin/page.tsx` (the link). Switch:
`SWITCHES.analytics`.

## What is recorded
| Kind | When | What |
|---|---|---|
| `page` | A screen is left, or the app put away | Time on show; the screen before, the tap that opened it and how long it took (`wait_ms`; the first screen: since the app started); requests, waiting and bytes per service. `resumed` when the app came back to it. |
| `click` | A tap on a link, button, switch or label | Its screen-reader name or its words (80 characters); a link's screen. Typed text is never read. |
| `action` | A tap on a control marked `data-action` (2026-10-22, the user: how much people pray and use the music) | Its name: `pray`, `music-play`, `music-pause`, `music-next`, `music-previous`, counted on the dashboard's first screen ("Prayer and music": times and people, `analytics_actions`, schema.sql 4b). Recorded instead of a `click`, because the buttons' words change with the count, the state and the language. The feature marking its buttons imports nothing of analytics. Needs schema.sql 4b, run before the code: the database refuses the new kind, with its batch, until then. |
| `error` | A failed Supabase request (`supabase`, with status), an error banner (`banner`), an uncaught error (`script`) | The message, or the status and the address without its query |
| `slow` | Any request of ours or Supabase's taking 3 s or more | The address without its query, the time |
| `vital` | Reported by `web-vitals` | The measure, its value, Google's rating |

## Decisions worth knowing
- **Supabase's documented `global.fetch`**, not a patched `window.fetch` (the user, 2026-10-22): every failed
  Supabase request on every phone, iPhones included. The app's own routes are covered by the error banners
  people see, one marked line instead of a change per route.
- **Through a route, with sendBeacon**, though a plain insert would pass RLS: the browser finishes a beacon
  while the app is being closed, which is when the last screen's time is known. The route still writes as the
  person (their client, RLS), never with the service key.
- **Sent when the app is put away, or at 50 events, not every 30 s** (the user, 2026-10-22). A 10-minute visit is
  one or two requests instead of about twenty: fewer Netlify function runs and Supabase writes, fewer wake-ups of
  an old phone's radio. Nothing is lost for it: until sent, the queue is also kept in localStorage under the
  person's id, so a crash or a flat battery (no put-away) leaves it for the next opening, which sends it at once;
  offline (`navigator.onLine` false) it waits instead of handing the browser a beacon it would drop; a shared
  phone never sends one person's events as another's. Still lost: a beacon handed over on a connection that
  fails on its way (the browser never retries one). Trade-off: the dashboard shows a visit once its phone puts
  the app away, not within 30 s. Measured in the pane: 40 s of tab switching sent nothing, 41 events kept; the
  put-away sent them in one request (204) and emptied the kept copy. Tested in `queue.test.ts` (7 cases).
- **Anyone signed in is recorded**, a person still waiting included (the user, 2026-10-22), so the setup
  steps show where people get stuck. They add rows about themselves and read none.
- **Kept 90 days** (the user, 2026-10-22), by a nightly pg_cron job.
- **Addresses lose their query** before they are stored: it carries ids, filters and signed picture tokens.
- **Aggregated in Postgres**, one function per list, run as the caller: a month of rows never leaves the database.
- **`web-vitals`**, Google's own library: INP in particular is easy to measure wrong by hand.

## Expected behavior
- `/admin/analytics`: the period (24 h / 7 days / 30 days, in the address), totals, and five screens: Screens,
  People (a row opens the person's timeline), What opens what, Problems, Resources per visit.
- Signed out, `/admin/analytics` redirects to `/login` and `POST /api/analytics/record` answers 401 (seen 2026-10-22).
- Seen 2026-10-22, after the SQL, on a local build signed in: 27 rows in minutes (taps, screens, a vital, a slow
  MP3 on `/prayer`). A group picture refused by the bucket's 200 KB limit showed as `400 /storage/v1/object/group-thumbnails/…`
  (`supabase`) followed by its banner (`banner`), on `/groups/manage/<id>`.
- A member opening `/admin/analytics` gets 404; the database gives them no rows either (`tests/rls.test.ts`).

## Edge cases
- Bytes are 0 for a request whose server does not allow the browser to report them (no `Timing-Allow-Origin`).
- Realtime (a WebSocket) and the server's own Supabase reads are not requests a phone sees; TTFB includes the latter.
- LCP and TTFB belong to the screen the app opened on; INP and CLS are reported for the screen on show when the app is put away.
- A phone that cannot send keeps its newest 500 events.
- The phone's clock dates each row; a time more than a day old or 5 minutes ahead is dropped by the route.
- In development React runs effects twice: requests made at start may count twice. Production is not affected.

## Remove
Run section 6 of `schema.sql`, delete this folder, `src/app/admin/analytics/`, `src/app/api/analytics/`, the
`// ANALYTICS` lines, the `analytics` switch, the `analytics_events` line in `features/approval/schema.sql`'s
comment and its `tests/rls.test.ts` case, and `npm uninstall web-vitals`.
