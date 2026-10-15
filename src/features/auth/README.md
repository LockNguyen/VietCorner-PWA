# auth

Sign in with an email and a password the phone remembers. Creating an account and resetting a password
each send one email with a link. Users stay signed in for months. What a new account may then do is the
`approval` feature's business.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor (one server-only table).
2. Supabase → Authentication → **SMTP Settings**: enable custom SMTP (required before templates can be edited).
   MVP option: Gmail SMTP (`smtp.gmail.com`, port 587, app password). Credentials live in Supabase, never here.
3. Supabase → Authentication → **URL Configuration**:
   - Site URL: `https://vietcorners.netlify.app`
   - Redirect URLs: `https://vietcorners.netlify.app/login/**` and, for testing, one line per other address
     in use, e.g. `http://localhost:3000/login/**` or the Tailscale Funnel address
     `https://desktop-2bln504.tail714ada.ts.net:8443/login/**`. `/login/**` covers both pages an email
     link opens (`/login/confirmed`, `/login/confirm`).
   A link to an address missing from this list is silently replaced by the Site URL (found 2026-10-14: a
   sign-up email from the Funnel address pointed at `localhost:3000`), and then it does nothing.
4. Supabase → Authentication → **Providers → Email**: Email provider on, **Confirm email on**, minimum
   password length **6** (`PasswordField.tsx` says the same number).
5. Supabase → Authentication → **Email Templates**. The two differ on purpose (Decisions, "No tap…").
   The link needs words between `<a>` and `</a>`: a link with nothing inside it is an email that looks
   empty (found 2026-10-12). "Magic Link" is no longer sent.
   **"Confirm signup"**: Supabase's own link, which confirms the address and then opens `/login/confirmed`.
   ```html
   <h2>Viet Corners</h2>
   <p>Bấm vào đường dẫn dưới đây để xác nhận email:<br>Tap the link below to confirm your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Xác nhận / Confirm</a></p>
   <p>Rồi quay lại ứng dụng Viet Corners.<br>Then go back to the Viet Corners app.</p>
   ```
   **"Reset Password"**: our link, `{{ .RedirectTo }}` = `/login/confirm?attempt=…`, plus the token.
   ```html
   <h2>Viet Corners</h2>
   <p>Bấm vào đường dẫn dưới đây để đặt lại mật khẩu:<br>Tap the link below to reset your password:</p>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}">Đặt lại mật khẩu / Reset password</a></p>
   <p>Nếu bạn không yêu cầu, xin bỏ qua email này.<br>If you did not ask for this, ignore this email.</p>
   ```
6. Supabase → Authentication → **Sessions**: leave "Time-box user sessions" and "Inactivity timeout" off
   (the default). Either would sign members out on a timer.
7. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `login_handoffs`: server-only (RLS on, no grants, no policies). `account_exists(address)`: yes or no, callable signed out |
| Text | `strings.ts` | Every word the user reads in this feature |
| Pure logic | `handoff.ts` | `newClaimKey`, `attemptOf` (its SHA-256), `isHex64`. Used by the browser and the server |
| Pure logic | `errors.ts` | Why a step failed, by cause (offline, wrong password, too short, not confirmed yet, …) |
| Device | `storage.ts` | The email this device waits on (sign-up: address and when; reset: also the secret key), kept across a reload for an hour |
| Device | `passwordManager.ts` | `rememberPassword`: asks Chrome's password manager to save; Safari offers by itself |
| Browser API | `api.ts` | `signIn` (the sign-up wait only), `signUp` (with the name as metadata), `sendPasswordReset`, `signInWithResetLink`, `leaveSignIn`, `collectSignIn`, `signOut` |
| State | `hooks/useTypedEmail.ts` | The email typed on the signed-out screens, kept for the visit (a failed sign-in comes back as a new page) |
| State | `hooks/useEmailLink.ts` | The asking device: create an account (then try the password every 15 s and on return to the app) or ask for a reset (then check every 3 s for the link handed back) |
| State | `hooks/useConfirmLink.ts` | The opened reset link: use it here, or offer to hand it over |
| State | `hooks/useLinkWorked.ts` | Whether Supabase accepted a sign-up link (it reports `error` in the address) |
| Server reads | `server/queries.ts` | `getCurrentUser(supabase)`: id and email from the login token, checked locally (no trip to Supabase). Routes that write call `auth.getUser()` instead. |
| Server logic | `server/signIn.ts` | `signInWithPassword` (with `account_exists` to tell "no account" from "wrong password"), `setNewPassword` |
| Server logic | `server/handoff.ts` | **Admin** client: `leaveSignIn`, `collectSignIn` |
| Server logic | `server/refreshSession.ts` | Called by `src/proxy.ts` on every non-static request: refreshes the session cookie and redirects (logged out → `/login`; logged in on `/login` → `HOME_PATH`) |
| Routes | `src/app/api/auth/handoff/route.ts`, `claim/route.ts` | Validate (400) → the step → 204 / `{ tokenHash }` |
| Routes | `src/app/api/auth/sign-in/route.ts`, `new-password/route.ts` | A plain form post → the step → 303 to Home, or back with `?problem=` |
| UI | `components/Welcome.tsx` | Signed out: sign in first; create an account, or forgot password; check your email. Language link at the top right |
| UI | `components/SignedOutFrame.tsx` | Every signed-out screen, in the app or in the browser a link opens: bar (setup steps only), language link top right, logo |
| UI | `components/SignInForm.tsx` | Two fields with their words inside, one blue button, "Forgot password?" under it, "Create new account" set apart below; a failure under the button with its link |
| UI | `components/SignUpForm.tsx` | Same shape as sign-in: title, name / email / password with their words inside (the last two carried over), Next off until all are filled, "I already have an account" set apart |
| UI | `components/PasswordField.tsx` | `ui/PasswordInput` (an eye shows the letters) with a label above, or its word inside (sign-in) |
| UI | `components/ForgotPasswordForm.tsx` | The address to send a reset link to |
| UI | `components/CheckEmail.tsx` | "We sent an email to …" while the link is awaited |
| UI | `components/NewPasswordForm.tsx` | Choose a new password (after a reset, or from Settings); a real form post |
| UI | `components/EmailConfirmed.tsx` | What a sign-up link opens: "Email confirmed, go back to the app", or "did not work" |
| UI | `components/ConfirmLink.tsx` | What a reset link opens: a spinner, one question, "done", or "did not work" |
| UI | `components/AccountSection.tsx` | Settings: the address, "Change password", `SignOutButton` |
| Shell | `src/app/login/page.tsx`, `login/confirmed/page.tsx`, `login/confirm/page.tsx`, `settings/password/page.tsx`, `settings/page.tsx` | Render the components (lines marked `AUTH`) |
| Shell | `src/proxy.ts` | Exists only for this feature |

**Data:** Supabase's built-in `auth.users`, and `login_handoffs`. The session lives in `sb-*` cookies
(400-day max age, renewed on each visit).

## Flow
Redesigned on 2026-10-14 after the user went through it: someone signed out should not click through
three screens to sign in again.
1. **Sign in** is the first screen, in Vietnamese with "English" at the top right, and no progress bar.
   Email + password, which the phone fills in if it saved them → signed in → Home.
   A failure is said under the button: "no account with this email yet" with a "Create an account" link
   (asked of the database by `account_exists`, since Supabase answers the same for both), or "that
   password is not right" beside "Forgot password?". "Forgot password?" → address → reset email → wait
   (step 4) → `/settings/password`.
2. **Create an account** ("No account yet? Create one", or the link in the error): name on top, then the
   email and password already typed; "Step 2 / 6". The name travels as account metadata and the profiles
   trigger saves it, so the name question never appears for them.
3. **Next →** `signUp` → confirmation email ("Step 3 / 6"). The link opens Supabase, which confirms
   the address and shows `/login/confirmed` ("go back to the app"). The app, still holding the password,
   tries to sign in every 15 s and the moment the person returns; "not confirmed" means keep waiting.
   Then the layout's steps: notifications (`push`, "Step 4 / 6"), waiting for an admin (`approval`, "Step 5 / 6").
   Step 6, "done", is never shown: the bar stops short so the person can see they are not finished yet.
   If the phone reloaded the app meanwhile, the password is gone (never stored): the screen offers
   "I tapped the link: sign me in", and the phone fills the saved password in.
4. **A reset's link** uses the hand-off below; the screen moves on by itself.

The progress bar (`src/components/SetupProgress.tsx`) has 6 steps: sign in (no bar), name, email,
notifications, waiting, done (never reached). Someone who only signs in sees none of it, and is not asked
about notifications: the switch in Settings is theirs.

## Saving the password
The goal: a member types their password once, ever. These make the phone offer to save it:
- Every password form is a real `<form>`, with the email as `autoComplete="username"` and the password as
  `current-password` (sign in) or `new-password` (create, reset). That is what iOS and Android read.
- **The person's own tap submits the form.** Safari offers to save only for a submission that a tap made.
  The cost, accepted by the user (2026-10-14): it offers after a wrong password too, when the form leaves
  the screen ("Forgot password?"). Tried and undone the same day: checking the password first and then
  submitting from code (`form.requestSubmit()` after the answer). No wrong password was offered, but no
  right one either: by then the tap was over, and Safari ignored the submission (seen on the iPhone after
  a reset). A green "Continue" tap after success would get both; the user chose one tap.
- **Sign-in and a new password are real form posts** (2026-10-14): `<form method="post">` to
  `POST /api/auth/sign-in` and `/api/auth/new-password`, which sign in (or save) on the server, set the
  login cookie and answer 303: Home, or the same screen with `?problem=<cause>`. Safari and Chrome are
  built around exactly this, and it is the one thing that made the iPhone offer "Save password?" after a
  correct sign-in. Everything tried first was sign-in by the page's own code and got no offer: a full
  reload after, a move to Home inside the page after, a submit from code after the answer.
  The routes refuse a post from another website (`Sec-Fetch-Site: cross-site`), and redirect with a
  relative address, since behind a tunnel the server does not know the address the phone used.
  A failed try comes back as a fresh page: the email is kept for the visit (`useTypedEmail`, session
  storage); the password is never written anywhere.
- On Chrome (Android) `rememberPassword` also asks directly (`navigator.credentials.store`), which shows
  Google's save sheet even if the form detection missed it. Safari has no such call.
- The new-password form shows the email read-only beside the password, so the saved pair has an owner.
On the sign-in screen the saved password appears above the keyboard; one tap fills both fields.

## Hand-off: how a reset link reaches an app it did not open in
On an iPhone an email link opens in Safari, and Safari shares no login with the Home Screen app. So the
link does not sign in the browser it opens in; it hands the sign-in to the device that asked.

1. **The app asks** for a reset. It makes a secret `claimKey` (32 random
   bytes), keeps it in `localStorage`, and sends only its SHA-256, the `attempt`, inside
   the link: `/login/confirm?attempt=<hash>`.
2. **Supabase emails the link**, adding its one-time token: `…&token_hash=<token>`.
3. **The link opens** `/login/confirm`. Opening it changes nothing.
   - *Same browser as the one that asked* (it holds a key whose hash is the `attempt`; Android and desktop):
     it uses the link on the spot and opens the new-password page.
   - *Any other browser* (every iPhone): "Sign in to Viet Corners?" and one button. The tap posts the token to
     `POST /api/auth/handoff`, which stores it under the `attempt`. Then: "Now open the app again."
4. **The app collects.** While it waits it posts its `claimKey` to `POST /api/auth/claim` every 3 seconds
   (only while on screen). The server hashes the key, finds the row, deletes it and returns the token; the
   app trades it for a session (`verifyOtp`, type `recovery`) and opens `/settings/password`.
   If the stored wait disappears meanwhile, the link was used in this same browser: the app reloads.

## Decisions worth knowing
- **Password sign-in, email links only to create and reset** (decided 2026-10-14, replacing sign-in links):
  a saved password is one tap forever, with no trip to the mailbox. The email still proves the address,
  so a reset email can reach the person later.
- **No tap to confirm a new account, one tap to reset a password** (decided 2026-10-14, after the first
  iPhone test). A link in Mail always opens Safari; the least distraction is a page that needs nothing.
  For a sign-up that is safe enough: a mail scanner opening the link only confirms an address, and the
  account still waits for an admin. For a reset it is not: the device holding the key is whoever asked,
  so a stranger typing your address would be let in by your mail scanner (Outlook opens links). The tap
  stays there.
- **The sign-up wait signs in with the password in memory**, so it needs no hand-off. Each try is a
  sign-in, which Supabase limits (about 30 per 5 minutes), hence every 15 s plus one on return to the app.
- **An existing address on "Create account" is said out loud.** Supabase answers "sent" and sends nothing
  (to hide which addresses exist); its only sign is a user with no identities. We show "This email already
  has an account" instead of a wait that never ends. Trade-off: a stranger can learn that an address has an
  account. For a church app, a confused elderly member waiting forever is the bigger harm.
- **The key never leaves the device; only its hash travels.** Reading the email, or the table, gives the
  `attempt` and not the key, so nobody else can collect. (The email also holds the token itself: whoever
  can read a person's mailbox can get in as them, as with any email reset.)
- **A reset is confirmed by a tap, never the page load.** Mail services open links to scan them. If opening were
  enough, a stranger could type someone's address and be signed in by that person's mail scanner.
- **The risk that remains:** a stranger types your address on "Forgot password", you get an email you did
  not ask for, and you tap its link AND the button. That signs the stranger's device in as you. The
  button's sentence says to tap only if you just asked.
- **The two routes verify no user**: their caller is not signed in yet. `handoff` stores one short value
  under a key of a fixed shape; `claim` needs the secret. Both check the shape of what they are sent.
  Nothing limits how often they are called (backlog B3).
- **A row lives at most an hour** (the link's own life) and is deleted when collected. Rows nobody
  collected are deleted by the next hand-off; there is no scheduler for it.
- **The wait survives a reload** (`storage.ts`): an iPhone often restarts the app when the person comes
  back from their mailbox, and the key must still be there.
- **Signed in for as long as possible:** the session cookie lasts 400 days (the browser maximum) and is
  renewed on every visit; Supabase refresh tokens never expire unless a time-box is set (Setup 6). An
  iPhone does not apply its 7-day storage limit to a Home Screen app, and our cookies are set by the server.
- **The proxy redirect is convenience, not security.** Routes and RLS do the real checking.
- **`server.ts` ignores cookie writes from Server Components** on purpose: the proxy is what writes cookies.

## Expected behavior
- Logged out, every page redirects to `/login`; `sw.js`, the manifest and icons still load, so the app can be
  installed before signing in. `/login/confirm` is under `/login`, so a signed-out browser reaches it.
- `/login` in a browser tab shows the `install` guide first; opened from the Home Screen (or after
  "Continue in this browser" on a computer) it shows the setup.
- Observed 2026-10-14 (production build, phone width, skipping the guide): "English" at the top, then
  "Đăng nhập", Email, Mật khẩu, Hiện mật khẩu, the button, "Quên mật khẩu?", "Chưa có tài khoản? Tạo tài
  khoản"; no bar. An unknown email → "That password is not right…" (`account_exists` not yet in the
  database, so the fallback). "Create one" → "Step 2 / 6", name on top, email and password kept; Next off
  until the name is typed, then on.
- Logged in, `/login` redirects to Home (`/`). The two email-link pages, `/login/confirm` and
  `/login/confirmed`, do not: on an iPhone they open in Safari, and a Safari signed in to the app would
  otherwise swallow the link (found 2026-10-14: a reset link "did nothing, just opened the web app").
- `/ui`, the component showcase, opens without signing in in development (`// UI SHOWCASE` in `refreshSession.ts`).
- `/login/confirmed` (production build, phone width, 2026-10-14): Vietnamese by default, logo, a tick,
  "Đã xác nhận email" and "go back to the app", and the English link; with `#error=…` in the address,
  "Đường dẫn này không dùng được" instead.
- `/login/confirm` without its two values: "This link did not work". With them, in a browser that did not
  ask: "Sign in to Viet Corners?", the warning line and "Yes, sign me in" (observed 2026-10-12).
- `POST /api/auth/claim` and `/handoff` answer 400 to anything not shaped like a key, an attempt or a
  token (observed 2026-10-12).
- Reloading or closing the app keeps you signed in.
- Settings shows the address, "Change password" (→ `/settings/password`) and Sign out. Signing out returns
  to `/login` with a full page load, which empties the pages kept in memory.
- **Not exercised (2026-10-14):** a real sign-up or reset email, the hand-off end to end, the "Save
  password?" offer on an iPhone or Android, `/settings/password` signed in.

## Edge cases
- Links expire after 1 hour (Supabase setting) and work once.
- Members created with the old sign-in link have no password: they use "Forgot password?" once.
- Signing in before tapping the confirmation link: "Your account is not confirmed yet…".
- "Start again" while waiting forgets the wait; creating the account again re-sends the confirmation.
- A sign-up link opened after the app already signed in, or opened twice: the second visit may say "did
  not work"; the account is confirmed either way.
- A reset link used by someone not yet named or approved: the layout shows its own step instead of the
  password page; they are signed in and can set a password later from Settings.
- The link opened on a computer while the phone asked: the computer shows the button; after the tap the
  phone moves on. The computer is not signed in.
- Supabase's built-in email sender is rate-limited to a few per hour; real users need custom SMTP.
- QA with a fresh account: use a Gmail `+` alias, or delete the user in Supabase → Authentication → Users.
- A user who stays away for more than 400 days signs in again; the saved password fills it in.
- Private browsing, or storage switched off: the wait does not survive a reload; the person asks again.

## Remove
Delete this folder, `src/proxy.ts`, `src/app/login/`, `src/app/settings/password/`, `src/app/api/auth/`,
and the `AUTH` lines in `src/app/settings/page.tsx`. Run the DROP at the bottom of `schema.sql`. Features
that need a user id stop working without a replacement.

## The sign-in screen's look (2026-10-14)
The user found the first version overwhelming: every line a question, no order. It now follows the big
messaging apps (Messenger, Instagram): the logo, two fields with their words inside (no labels above), one
blue button, "Forgot password?" small under it, and "Create new account" as an outlined button set apart by
space, a different path rather than one more question. "Show password" is an eye inside the field, not a
row. No hints until something goes wrong. Visible words, measured: English, Đăng nhập, Quên mật khẩu?,
Tạo tài khoản mới, and the two field words.

## Safari first, then install (2026-10-14, proven on the iPhone)
Tests on the user's iPhone settled where passwords can live:
- **Inside the installed Home Screen app, iOS neither offers to save a password nor fills one in**, with
  either version of the sign-in form. Safari does both.
- **Signing in in Safari, then adding to the Home Screen, opens the app already signed in**: iOS copies
  Safari's cookies into the app at that moment.

So signing in happens in the browser and installing comes after: `/login` is no longer wrapped in the install
guide; the root layout wraps signed-in pages in `InstallGate` instead (the `install` feature), and the
guide is setup step 4 of 7 for a new member. A sign-up link opened in the same browser signs in right there
(`useConfirmedLink`, Supabase's `?code=` exchange) and goes on to the guide; in any other browser it says
"Email confirmed, go back to the page where you created your account", where the waiting tab moves on.
**Not fixable here:** someone signed out *inside* the installed app gets no fill-in; they type the password,
or delete the icon and sign in again in Safari, then install. With a 400-day sign-in renewed on every visit,
that should be rare.

## Errors
A failed sign-in or new password comes back from the route as `?problem=`; `useProblemBanner` says it once
in the app's banner and removes it from the address. "Wrong password. **Forgot password?**" and "Account not
created yet. **Create new account?**" end in a link (15 s instead of 8). No inline error text (the user's word).
Observed 2026-10-14 (production build, 375 px, picture taken): an unknown email → the banner with its link and
a close cross; the link opens sign-up ("Bước 2 / 7") with the email kept.
