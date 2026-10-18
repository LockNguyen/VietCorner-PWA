# auth

Sign in with an email address and nothing else: the app emails a link, the person taps it, goes back to the
app, and is signed in, for as long as they do not sign out. Creating an account works the same way, with a
name. No passwords (since 2026-10-17). What a new account may then do is the `approval` feature's business.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor (one server-only table, `account_exists`).
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
   (a new account's first link) both get our link, `{{ .RedirectTo }}` = `/login/confirm?attempt=…`, plus the
   token. The link needs words between `<a>` and `</a>`: a link with nothing inside it is an email that looks
   empty (found 2026-10-12). "Reset Password" is no longer sent.
   ```html
   <h2>Viet Corners</h2>
   <p>Bấm vào đường dẫn dưới đây để đăng nhập:<br>Tap the link below to sign in:</p>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}">Đăng nhập / Sign in</a></p>
   <p>Rồi quay lại ứng dụng Viet Corners.<br>Then go back to the Viet Corners app.</p>
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
| Pure logic | `errors.ts` | Why a step failed, by cause (offline, too many tries, bad address, bad link, no account) |
| Device | `storage.ts` | The sign-in this device waits on (secret key, address, when), kept across a reload for an hour |
| Browser API | `api.ts` | `accountExists`, `sendSignInLink` (with a name: may create the account), `signInWithLink`, `leaveSignIn`, `collectSignIn`, `signOut` |
| State | `hooks/useEmailLink.ts` | The asking device: send the link, then check every 3 s (and on return to the app) for the sign-in handed back |
| State | `hooks/useConfirmLink.ts` | The opened link: sign in here if this browser asked, or offer to hand it over (one tap) |
| Server reads | `server/queries.ts` | `getCurrentUser(supabase)`: id and email from the login token, checked locally (no trip to Supabase). Routes that write call `auth.getUser()` instead. |
| Server logic | `server/handoff.ts` | **Admin** client: `leaveSignIn`, `collectSignIn` |
| Server logic | `server/refreshSession.ts` | Called by `src/proxy.ts` on every non-static request: refreshes the session cookie and redirects (logged out → `/login`; logged in on `/login` → `HOME_PATH`) |
| Routes | `src/app/api/auth/handoff/route.ts`, `claim/route.ts` | Validate (400) → the step → 204 / `{ tokenHash }` |
| UI | `components/Welcome.tsx` | Signed out: sign in, or create an account; then "check your email". Says what went wrong in the app's banner |
| UI | `components/SignedOutFrame.tsx` | Every signed-out screen, in the app or in the browser a link opens: bar (setup steps only), language link top right, logo |
| UI | `components/SignInForm.tsx` | The email, one blue "Sign in", and "Create new account?" small under it |
| UI | `components/SignUpForm.tsx` | Title, name and email with their words inside, the text size (from the page), Next (off until both are filled). Back to sign-in is the frame's arrow |
| UI | `components/CheckEmail.tsx` | "Check your email", the address, "Tap the link in it, then come back here.", "Not there? Look in Spam." |
| UI | `components/ConfirmLink.tsx` | What the link opens: a spinner, "Sign in?" with "Only if you just asked to." and one button, "Done, go back to the app", or "This link has expired" |
| UI | `components/AccountSection.tsx` | Settings: the address and `SignOutButton` |
| Shell | `src/app/login/page.tsx`, `login/confirm/page.tsx`, `settings/page.tsx` | Render the components (lines marked `AUTH`) |
| Shell | `src/proxy.ts` | Exists only for this feature |

**Data:** Supabase's built-in `auth.users`, and `login_handoffs`. The session lives in `sb-*` cookies
(400-day max age, renewed on each visit).

## Flow
Redesigned on 2026-10-17 on the user's word: no passwords, so nothing to forget and no reset.
1. **Sign in** is the first screen, in Vietnamese with "English" at the top right, and no progress bar: the
   email, "Đăng nhập", and "Tạo tài khoản mới?" under it.
   - An address with no account (`account_exists`) → no email; the banner "Account not created yet.
     **Create new account?**", whose link opens sign-up with the email kept.
   - Otherwise → Supabase emails the sign-in link (`signInWithOtp`, never creating an account here) →
     "Check your email" while the app waits (step 3).
2. **Create an account**: a back arrow to sign-in at the top left, name and email ("Step 1 / 6"), Next → the same link (`signInWithOtp` with the name
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

1. **The app asks.** It makes a secret `claimKey` (32 random bytes), keeps it in `localStorage`, and sends
   only its SHA-256, the `attempt`, inside the link: `/login/confirm?attempt=<hash>`.
2. **Supabase emails the link**, adding its one-time token: `…&token_hash=<token>`.
3. **The link opens** `/login/confirm`. Opening it changes nothing.
   - *Same browser as the one that asked* (it holds a key whose hash is the `attempt`; Android, a computer):
     it uses the link on the spot and opens Home.
   - *Any other browser* (every iPhone): one question and one button. The tap posts the token to
     `POST /api/auth/handoff`, which stores it under the `attempt`. Then: "Now go back to the app."
4. **The app collects.** While it waits it posts its `claimKey` to `POST /api/auth/claim` every 3 seconds
   (only while on screen). The server hashes the key, finds the row, deletes it and returns the token; the
   app trades it for a session (`verifyOtp`, type `email`) and opens Home with a full page load.
   If the stored wait disappears meanwhile, the link was used in this same browser: the app reloads.

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
  `attempt` and not the key, so nobody else can collect. (The email also holds the token itself: whoever can
  read a person's mailbox can get in as them, as with any email sign-in.)
- **The two routes verify no user**: their caller is not signed in yet. `handoff` stores one short value
  under a key of a fixed shape; `claim` needs the secret. Both check the shape of what they are sent.
  Nothing limits how often they are called (backlog B3).
- **A row lives at most an hour** (the link's own life) and is deleted when collected. Rows nobody collected
  are deleted by the next hand-off; there is no scheduler for it.
- **The wait survives a reload** (`storage.ts`): an iPhone often restarts the app when the person comes back
  from their mailbox, and the key must still be there.
- **Signed in for as long as possible:** the session cookie lasts 400 days (the browser maximum) and is
  renewed on every visit; Supabase refresh tokens never expire unless a time-box is set (Setup 6). An iPhone
  does not apply its 7-day storage limit to a Home Screen app, and our cookies are set by the server.
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
- **Not exercised (2026-10-17):** a real email (the templates in Setup 5 must be changed first), the tap in
  Safari on an iPhone, a new account end to end.

## Edge cases
- Links expire after 1 hour (Supabase setting) and work once. Supabase allows one link per address per minute
  ("Too many tries").
- Members who had a password: it is kept by Supabase and never asked for; they sign in by link like everyone.
- "Start again" while waiting forgets the wait; asking again sends a new link (the old one still works once).
- The link opened on a computer while the phone asked: the computer shows the button; after the tap the phone
  moves on. The computer is not signed in.
- Supabase's built-in email sender is rate-limited to a few per hour; real users need custom SMTP.
- QA with a fresh account: use a Gmail `+` alias, or delete the user in Supabase → Authentication → Users.
- A user who stays away for more than 400 days signs in again, by link.
- Private browsing, or storage switched off: the wait does not survive a reload; the person asks again.

## Remove
Delete this folder, `src/proxy.ts`, `src/app/login/`, `src/app/api/auth/`, and the `AUTH` lines in
`src/app/settings/page.tsx`. Run the DROP at the bottom of `schema.sql`. Features that need a user id stop
working without a replacement.

## Safari first, then install (2026-10-14, proven on the iPhone)
**Signing in in Safari, then adding to the Home Screen, opens the app already signed in**: iOS copies Safari's
cookies into the app at that moment. So `/login` is not wrapped in the install guide; the root layout wraps
signed-in pages in `InstallGate` instead (the `install` feature), and the guide is setup step 3 of 6 for a new
member. (This order began for saved passwords, gone since 2026-10-17; it still saves an install for someone
who signs in from a browser.) Signing in inside the installed app works too, through the hand-off.

## Errors
Every failure is said once in the app's banner (no inline error text, the user's word). "Account not created
yet. **Create new account?**" ends in a link (15 s instead of 8).
