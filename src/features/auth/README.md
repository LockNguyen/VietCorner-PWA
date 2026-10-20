# auth

Sign in with an email address and nothing else: the app emails a link, the person taps it, goes back to the
app, and is signed in, for as long as they do not sign out. Creating an account works the same way, with a
name. No passwords (since 2026-10-17). What a new account may then do is the `approval` feature's business.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor (one server-only table, `sign_in_links`, and `account_exists`).
   Running it again on 2026-10-19 or later drops the old `login_handoffs` table.
2. Supabase → Authentication → **SMTP Settings**: enable custom SMTP (required before templates can be edited).
   MVP option: Gmail SMTP (`smtp.gmail.com`, port 587, app password). Credentials live in Supabase, never here.
3. Supabase → Authentication → **URL Configuration**:
   - Site URL: `https://vietcorners.netlify.app`
   - Redirect URLs: `https://vietcorners.netlify.app/login/**` and, for testing, one line per other address
     in use, e.g. `http://localhost:3000/login/**` or the Tailscale Funnel address
     `https://desktop-2bln504.tail714ada.ts.net:8443/login/**`.
   A link to an address missing from this list is silently replaced by the Site URL (found 2026-10-14: a
   sign-up email from the Funnel address pointed at `localhost:3000`), and then it does nothing.
4. Supabase → Authentication → **Providers → Email**: Email provider on, **Confirm email on**.
5. Supabase → Authentication → **Email Templates**: **"Magic Link"** (signing in) and **"Confirm signup"**
   (a new account's first link) both get our link, `{{ .RedirectTo }}` = `/login/confirm?attempt=…&key=…`.
   Since 2026-10-19 the `token_hash` the template adds is ignored (it is cancelled by the next email); it may
   stay, or be removed, which changes nothing. The link needs words between `<a>` and `</a>`: a link with nothing inside it is an email that looks
   empty (found 2026-10-12). "Reset Password" is no longer sent.
   ```html
   <h2>Viet Corners</h2>
   <p>Bấm vào đường dẫn dưới đây để đăng nhập:<br>Tap the link below to sign in:</p>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}">Đăng nhập / Sign in</a></p>
   <p>Rồi quay lại ứng dụng Viet Corners.<br>Then go back to the Viet Corners app.</p>
   <p>Nếu bạn không yêu cầu, xin bỏ qua email này.<br>If you did not ask for this, ignore this email.</p>
   ```
6. Supabase → Authentication → **Sessions**: leave "Time-box user sessions" and "Inactivity timeout" off
   (the default). Either would sign members out on a timer. Turn **"Detect and revoke potentially compromised
   refresh tokens" off** (2026-10-19): with it on, a phone that missed the reply of a token renewal shows the
   used token again and Supabase ends its whole session (Decisions, "Reuse detection off").
   **Access token expiry** (Authentication → Sessions, or JWT Keys): **900 seconds** (2026-10-19, the user). A
   permission change reaches a member when their token is renewed, so 15 minutes instead of an hour. Safe
   only with reuse detection off: four times the renewals would be four times the chances of a lost reply.
7. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `sign_in_links`: server-only (RLS on, no grants, no policies). `account_exists(address)`: yes or no, callable signed out |
| Text | `strings.ts` | Every word the user reads in this feature |
| Pure logic | `handoff.ts` | `newSecret`, `hashOf` (its SHA-256), `isHex64`: the device's claim key and the server's link key. Used by the browser and the server |
| Pure logic | `errors.ts` | Why a step failed, by cause (offline, too many tries, bad address, bad link, no account) |
| Device | `storage.ts` | The sign-in this device waits on (key, address, when), kept across a reload until the church day ends; `todaysClaimKey`, one key per device per church day |
| Browser API | `api.ts` | `accountExists`, `sendSignInLink` (POST `/api/auth/link`; with a name: may create the account), `signInWithLink`, `leaveSignIn`, `collectSignIn`, `signOut` |
| State | `hooks/useEmailLink.ts` | The asking device: send the link, then check every 3 s (and on return to the app) for the sign-in handed back |
| State | `hooks/useConfirmLink.ts` | The opened link: sign in here if this browser asked, or offer to hand it over (one tap) |
| Server reads | `server/queries.ts` | `getCurrentUser(supabase)`: id and email from the login token, checked locally (no trip to Supabase). Routes that write call `auth.getUser()` instead. |
| Server logic | `server/sendLink.ts` | **Admin** client: `sendSignInLink`: Supabase emails the link, with our own key in it; the key's hash is kept until the end of the church day |
| Server logic | `server/handoff.ts` | **Admin** client: `leaveSignIn` (marks a link tapped), `collectSignIn` (spends the device's links, returns a fresh token from `generateLink`) |
| Server logic | `server/refreshSession.ts` | Called by `src/proxy.ts` on every non-static request: refreshes the session cookie and redirects (logged out → `/login`; logged in on `/login` → `HOME_PATH`) |
| Routes | `src/app/api/auth/link/route.ts`, `handoff/route.ts`, `claim/route.ts` | Validate (400) → the step → 204 / 410 (a link not of today) / `{ tokenHash }`; `link` answers Supabase's own status and `code` |
| UI | `components/Welcome.tsx` | Signed out: sign in, or the sign-up steps (the page's first step, the text size; then name and email), then "check your email". Each step slides in (`lib/slide.ts` `slide`), each has a back arrow to the one before. Says what went wrong in the app's banner |
| UI | `components/SignedOutFrame.tsx` | Every signed-out screen, in the app or in the browser a link opens: bar (setup steps only), language link top right, logo |
| UI | `components/SignInForm.tsx` | The email, one blue "Sign in", and "Create new account?" small under it |
| UI | `components/SignUpForm.tsx` | Title, name and email with their words inside, Next (off until both are filled). Back is the frame's arrow |
| UI | `components/CheckEmail.tsx` | "Check your email" and the address, in bold; "Tap the link in it, then come back here." Back is the frame's arrow |
| UI | `components/ConfirmLink.tsx` | What the link opens: a spinner, "Sign in?" with "Only if you just asked to." and one button, "Done, go back to the app", or "This link has expired" |
| UI | `components/EmailRow.tsx` | The Settings row showing the signed-in email (read only) |
| UI | `components/SignOutButton.tsx` | The red button at the foot of Settings, tapped twice (`useConfirmTap`) |
| Shell | `src/app/login/page.tsx`, `login/confirm/page.tsx`, `settings/page.tsx` | Render the components (lines marked `AUTH`) |
| Shell | `src/proxy.ts` | Exists only for this feature |

**Data:** Supabase's built-in `auth.users`, and `sign_in_links`. The session lives in `sb-*` cookies
(400-day max age, renewed on each visit).

## Flow
Redesigned on 2026-10-17 on the user's word: no passwords, so nothing to forget and no reset.
0. **On the website** (a browser tab), the language page and the install guide come first (the install README);
   on a phone that is all, and what follows happens in the installed app.
1. **Sign in** is the first screen, in Vietnamese with "English" at the top right, and no progress bar: the
   email, "Đăng nhập", and "Tạo tài khoản mới?" under it.
   - An address with no account (`account_exists`) → no email; the banner "Account not created yet.
     **Create new account?**", whose link opens sign-up with the email kept.
   - Otherwise → our server has Supabase email the sign-in link (`/api/auth/link` → `signInWithOtp`, never
     creating an account here) →
     "Check your email" while the app waits (step 3).
2. **Create an account**, each step sliding in from the right with a back arrow to the one before: the text
   size ("Step 1 / 7", the `text-size` feature, brought by the page), then name and email ("Step 2 / 7"), Next → the same link (`signInWithOtp` with the name
   as metadata; the profiles trigger saves it, so the name question never appears). An address that already
   has an account just gets a sign-in link.
3. **The link** opens `/login/confirm` (on an iPhone, in Safari): "Sign in?" and one button; after the tap,
   "Go back to the Viet Corners app." Every line short (the user, 2026-10-17: a long sentence is not read). The app, checking every 3
   seconds and the moment it is opened again, collects the sign-in and goes Home (the hand-off below).
   A new member then sees the layout's steps: install, notifications, waiting for an admin.

## Hand-off: how an email's link signs in an app it did not open in
On an iPhone an email link opens in Safari, and Safari shares no login with the Home Screen app; no web page
can open the installed app either. So the link does not sign in the browser it opens in; it hands the
sign-in to the device that asked.

1. **The app asks.** It holds a secret `claimKey` (32 random bytes, **one per device per church day**, kept in
   `localStorage`) and sends only its SHA-256, the `attempt`, to `POST /api/auth/link`.
2. **Our server has Supabase email the link** (`server/sendLink.ts`): `/login/confirm?attempt=<hash>&key=<linkKey>`.
   The `linkKey` is made by the server for this one email; the browser that asked never sees it, and the table
   keeps only its hash, with the address and the end of the church day.
3. **The link opens** `/login/confirm`. Opening it changes nothing.
   - *Same browser as the one that asked* (it holds today's key; Android, a computer): it marks the link
     tapped, collects at once and opens Home.
   - *Any other browser* (every iPhone): one question and one button. The tap posts `attempt` and `key` to
     `POST /api/auth/handoff`, which marks that row tapped if it is one of today's links for that attempt.
     Then: "Now go back to the app."
4. **The app collects.** While it waits it posts its `claimKey` to `POST /api/auth/claim` every 3 seconds
   (only while on screen). The server hashes the key, deletes the tapped row (and the device's other links of
   the day), makes a fresh one-time token for that address (`generateLink`, which sends nothing) and returns
   it; the app trades it for a session (`verifyOtp`, type `email`) and opens Home with a full page load.
   If the stored wait disappears meanwhile, the link was used in this same browser: the app reloads.

**Why every link of the day works (2026-10-19, the user).** Members ask twice; Gmail folds the two emails
into one thread and hides one of them, and the older link used to leave the app waiting forever, for two
reasons: each request made a new device key (so the older link named an attempt nobody waited on), and each
new Supabase email cancels the token of the one before. Now the device key is the same all day and the proof
in the link is our own key, which no newer email cancels. Bound, as the user set it: a link from this
mailbox, sent the same church day.

## Decisions worth knowing
- **Email link only, no passwords** (2026-10-17, the user, replacing the password sign-in of 2026-10-14):
  someone signed out types only their address; nothing to remember, nothing to reset. The cost is a trip to
  the mailbox, which a member should rarely make: the sign-in lasts until they sign out (below).
- **Sign-up sends the same link** (the user, 2026-10-17): one flow to learn. A new account is created when
  its link is asked for, and confirmed when it is used.
- **One tap on the link's page** (the user, 2026-10-17). Mail services open links to scan them. If opening
  were enough, a stranger could type someone's address on their own phone and be signed in by that person's
  mail scanner. The button's sentence says to tap only if you just asked.
- **The risk that remains:** a stranger types your address, you get an email you did not ask for, and you tap
  its link AND the button. That signs the stranger's device in as you.
- **"No account yet" is said out loud** (`account_exists`, callable signed out): an elderly member is told
  at once instead of waiting for an email that never comes. Trade-off: anyone can learn whether an address
  has an account.
- **The key never leaves the device; only its hash travels.** Reading the email, or the table, gives the
  `attempt` and not the key, so nobody else can collect. (Whoever can read a person's mailbox and taps the
  button can still sign in the device that asked, as with any email sign-in.)
- **The link's own key is made by the server and seen only by the email** (2026-10-19). So whoever asked for
  a link cannot approve it themselves: only a tap with the key from the mailbox can.
- **The three routes verify no user**: their caller is not signed in yet. `link` does what the public key
  already allows (ask Supabase for a link to an address); `handoff` needs a key only the email holds; `claim`
  needs the device's secret. All check the shape of what they are sent. Only Supabase limits how often they
  are called (backlog B3).
- **A row lives until the end of the church day it was sent on** (`churchTime.endOfChurchDay`), and is deleted
  when its device collects. Rows of past days are deleted by the next link sent; there is no scheduler.
- **The wait survives a reload** (`storage.ts`): an iPhone often restarts the app when the person comes back
  from their mailbox, and the key must still be there.
- **Signed in for as long as possible:** the session cookie lasts 400 days (the browser maximum) and is
  renewed on every visit; Supabase refresh tokens never expire unless a time-box is set (Setup 6). An iPhone
  does not apply its 7-day storage limit to a Home Screen app, and our cookies are set by the server.
- **Reuse detection off** (the user, 2026-10-19; Setup 6): a refresh token works once. When the proxy renews
  it but the reply never reaches the phone (iOS paused the app, a prefetch was cancelled), the phone keeps
  the used one. With detection on, its next launch ended the whole session (`refresh_token_already_used` in
  the auth logs, several members on the first day). Off, the old token is simply renewed. Trade-off: a copy
  of an old token still gets in, which needs the unlocked phone or malware on it. Backlog B45 keeps
  detection on by holding the token on the server.
- **The proxy redirect is convenience, not security.** Routes and RLS do the real checking.
- **`server.ts` ignores cookie writes from Server Components** on purpose: the proxy is what writes cookies.

## Expected behavior
- Logged out, every page redirects to `/login`; `sw.js`, the manifest and icons still load, so the app can be
  installed before signing in. `/login/confirm` is under `/login`, so a signed-out browser reaches it.
- Logged in, `/login` redirects to Home (`/`). `/login/confirm` does not: on an iPhone it opens in Safari, and
  a Safari signed in to the app would otherwise swallow the link (found 2026-10-14).
- `/ui`, the component showcase, opens without signing in in development (`// UI SHOWCASE` in `refreshSession.ts`).
- Observed 2026-10-17 (local production build, 375 px, pictures taken): "English" at the top right, the logo,
  Email, "Đăng nhập", "Tạo tài khoản mới?"; nothing else. An unknown address → the banner "Tài khoản chưa được
  tạo. **Tạo tài khoản mới?**" and no email; its link opens "Tạo tài khoản" with the email kept and the name
  empty. A known address → "Đã gửi email tới …"; the token posted to `/api/auth/handoff` as Safari would after
  the tap → the waiting app signed in and opened "Trang chủ" within seconds. `/login/confirm` in another
  browser: "Đăng nhập vào Viet Corners?", the warning line and "Đồng ý, đăng nhập". Settings: the address and
  "Đăng xuất" (no password row).
- `POST /api/auth/claim` and `/handoff` answer 400 to anything not shaped like a key, an attempt or a token.
- Reloading or closing the app keeps you signed in. Signing out returns to `/login` with a full page load,
  which empties the pages kept in memory.
- **Not exercised (2026-10-19):** the day-long links end to end (a real email, an older link tapped after a
  newer one, `generateLink` for a brand-new account). Tested: `endOfChurchDay`, the key helpers, the build.
- **Not exercised (2026-10-17):** a real email (the templates in Setup 5 must be changed first), the tap in
  Safari on an iPhone, a new account end to end.

## Edge cases
- A link works until midnight at church on the day it was sent, even after newer ones, and signs in once:
  collecting spends every link of that device for the day. Supabase allows one link per address per minute
  ("Too many tries"). Its own "Email OTP expiration" setting no longer matters: the token is made at
  collection and used within seconds.
- Members who had a password: it is kept by Supabase and never asked for; they sign in by link like everyone.
- "Start again" while waiting forgets the wait but keeps today's key; asking again sends a new link, and the
  older one still works.
- A sign-in waiting when the 2026-10-19 SQL is run is lost (its table is replaced): the person asks again.
- A link sent at 11:58 PM church time works for two minutes. Accepted: "the same day" is the user's rule.
- The link opened on a computer while the phone asked: the computer shows the button; after the tap the phone
  moves on. The computer is not signed in.
- Supabase's built-in email sender is rate-limited to a few per hour; real users need custom SMTP.
- QA with a fresh account: use a Gmail `+` alias, or delete the user in Supabase → Authentication → Users.
- A user who stays away for more than 400 days signs in again, by link.
- A deploy does not sign anyone out: the cookies live on the phone, not on Netlify. It made the lost renewal
  (Decisions, "Reuse detection off") likelier: Next.js reloads an open app when a new version is out, which
  cancels requests on their way, and the first answers after a deploy are slow. With detection off, harmless.
- Members signed out before 2026-10-19 (their session was already ended) sign in once more; turning
  detection off does not bring an ended session back.
- To check detection is off: open the app, wait over 15 minutes, deploy, open it again. Still signed in, and no
  `refresh_token_already_used` in Supabase → Logs → Auth.
- Private browsing, or storage switched off: the wait does not survive a reload; the person asks again.

## Remove
Delete this folder, `src/proxy.ts`, `src/app/login/`, `src/app/api/auth/`, and the `AUTH` lines in
`src/app/settings/page.tsx`. Run the DROP at the bottom of `schema.sql`. Features that need a user id stop
working without a replacement.

## Safari first, then install (2026-10-14; REPLACED 2026-10-20 by "install first", the install README)
Kept for the record. iOS copies only regular Safari's cookies, so this order failed for someone in Chrome on an
iPhone or a Private tab. A phone's browser now shows only the language page and the install guide on `/login`.

**Signing in in Safari, then adding to the Home Screen, opens the app already signed in**: iOS copies Safari's
cookies into the app at that moment. So `/login` is not wrapped in the install guide; the root layout wraps
signed-in pages in `InstallGate` instead (the `install` feature), and the guide is setup step 3 of 6 for a new
member. (This order began for saved passwords, gone since 2026-10-17; it still saves an install for someone
who signs in from a browser.) Signing in inside the installed app works too, through the hand-off.

## Errors
Every failure is said once in the app's banner (no inline error text, the user's word). "Account not created
yet. **Create new account?**" ends in a link (15 s instead of 8).
