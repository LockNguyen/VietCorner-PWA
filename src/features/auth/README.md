# auth

Sign in with an email address and a one-time code. The first sign-in creates the account, and users stay
signed in for months.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Supabase → Authentication → **SMTP Settings**: enable custom SMTP (required before templates can be edited).
   MVP option: Gmail SMTP (`smtp.gmail.com`, port 587, app password). Credentials live in Supabase, never here.
2. Supabase → Authentication → **Email Templates**: add `{{ .Token }}` to **both** "Confirm signup" and
   "Magic Link". Supabase sends the first to new emails and the second to returning ones; a template without
   the token sends a link, and the app expects a code.
3. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Files
| Layer | File | Job |
|---|---|---|
| Text | `strings.ts` | Every word the user reads in this feature |
| Browser API | `api.ts` | `sendLoginCode` (`signInWithOtp`), `verifyLoginCode` (`verifyOtp`, type `email`), `signOut` |
| Server reads | `server/queries.ts` | `getCurrentUser(supabase)`: used by every page that needs the signed-in user |
| Server logic | `server/refreshSession.ts` | Called by `src/proxy.ts` on every non-static request: refreshes the session cookie and redirects (logged out → `/login`; logged in on `/login` → `HOME_PATH`) |
| UI | `components/LoginForm.tsx` | Email step → code step; calls `api.ts` |
| UI | `components/AccountSection.tsx` | "Signed in as …" + `SignOutButton` |
| UI | `components/SignOutButton.tsx` | `api.signOut()` → `/login` |
| Shell | `src/app/login/page.tsx`, `src/app/settings/page.tsx` | Render the components (lines marked `AUTH`) |
| Shell | `src/proxy.ts` | Exists only for this feature |

**Data:** Supabase's built-in `auth.users`. No tables of our own, so no `schema.sql`. The session lives in
`sb-*` cookies (400-day max age, renewed on each visit).

## Decisions worth knowing
- **A typed code, not a magic link.** On iPhone, email links open in Safari, whose cookies are separate from
  the Home Screen app, so a link would leave the installed app logged out.
- **The proxy redirect is convenience, not security.** Routes and RLS do the real checking; the proxy only
  saves a user from seeing an empty page.
- **`server.ts` ignores cookie writes from Server Components** on purpose: the proxy is what writes cookies.

## Flow
1. Any page while logged out → proxy → `/login`.
2. Email entered → Supabase sends a code (creating the account if the email is new).
3. Code entered → `verifyOtp` sets the cookies → `HOME_PATH`.
4. Later requests → proxy validates with `getClaims()` and refreshes when expired.

## Expected behavior
- Logged out, every page redirects to `/login`; `sw.js`, the manifest and icons still load, so the app can be
  installed before signing in.
- Logged in, `/login` redirects to Home (`/`).
- One exception to the redirect: `/ui`, the component showcase, opens without signing in when the app runs
  in development (`// UI SHOWCASE` in `refreshSession.ts`). In production it is redirected like any page.
- New and returning users both receive exactly one email containing a code. There is no sign-up page.
- "Send me a code" turns into a turning circle and "Sending…" and takes no more taps until the request
  ends (observed 2026-10-07: three quick taps made one request; after a failure the button came back with
  the error). Before this, a second tap emailed a second, different code. Errors now appear as a banner.
- Reloading or closing the app keeps you signed in.
- Settings shows "Signed in as <email>"; signing out returns to `/login`.
- The tab bar also shows on `/login`; tapping a tab just redirects back. Left as is so the shell needs no
  knowledge of auth.

## Edge cases
- Codes expire after 1 hour (Supabase setting).
- Supabase's built-in email sender is rate-limited to a few per hour; real users need custom SMTP.
- QA with a fresh account: use a Gmail `+` alias, or delete the user in Supabase → Authentication → Users.
- A user who stays away for more than 400 days signs in again. Push still reaches them; it needs no cookie.

## Remove
Delete this folder, `src/proxy.ts`, `src/app/login/`, and the `AUTH` lines in `src/app/settings/page.tsx`.
Features that need a user id (chat, assistant) stop working without a replacement.
