# auth

Email + one-time-code login using Supabase. The account is created on first login, and the user stays signed in.

Full docs: `.claude/architecture.md` → 6.1 auth.

## Files
- `LoginForm.tsx`: email → code → signed in
- `refreshSession.ts`: keeps the session fresh and redirects logged-out users (called by `src/proxy.ts`)
- `AccountSection.tsx` + `SignOutButton.tsx`: shown on the Settings page

## Remove
Delete this folder, `src/proxy.ts`, and `src/app/login/`, then remove the lines marked `AUTH` in `src/app/settings/page.tsx`.
