# auth

Email + one-time-code login using Supabase. The account is created on first login, and the user stays signed in.

Full docs: `.claude/architecture.md` → 6.1 auth.

## Files (standard feature shape)
| Layer | File | Job |
|---|---|---|
| Browser API | `api.ts` | `sendLoginCode`, `verifyLoginCode`, `signOut` |
| UI | `components/LoginForm.tsx` | Email → code → signed in |
| UI | `components/AccountSection.tsx`, `components/SignOutButton.tsx` | Shown on the Settings page |
| Server reads | `server/queries.ts` | `getCurrentUser` |
| Server logic | `server/refreshSession.ts` | Keeps the session fresh and redirects logged-out users (called by `src/proxy.ts`) |

## Remove
Delete this folder, `src/proxy.ts`, and `src/app/login/`, then remove the lines marked `AUTH` in `src/app/settings/page.tsx`.
