# VietCorner PWA: Architecture

> The source of truth for how this system works. Read top to bottom.

## 1. Overview
A Progressive Web App (installable website) for a church community. Three independent features:
| Feature | Folder | Status |
|---|---|---|
| Login (auth) | `src/features/auth/` | Not built |
| Group chat + push | `src/features/chat/` | Not built |
| English/Vietnamese | `src/features/i18n/` | Not built |
| Voice AI assistant (RAG) | `src/features/assistant/` | Not built |

## 2. Tech Stack
| Layer | Choice | Why |
|---|---|---|
| UI + server | Next.js App Router, React, TypeScript | One project for pages and API routes |
| Styling | Tailwind | Styles live next to the markup |
| Auth + database | Supabase (Postgres, pgvector) | Login, data, and vector search in one free service |
| Push | Web Push + service worker (`web-push`) | Standard, free, works while the app is closed |
| AI | Groq (Whisper, Llama) | Free tier |
| Hosting | Vercel | Free HTTPS, which push requires |

## 3. Folder Map
```
src/
  app/          Next.js routes (thin: they only compose features)
  components/   App shell UI shared by all pages (tab bar, header)
  features/     One folder per removable feature
  lib/          Shared clients (supabase, groq), no feature logic
public/         sw.js, icons/
```

## 4. Rules of the Codebase
- Features never import each other's internals.
- `src/app` pages only wire features together.
- Each feature folder contains: `components/`, `server/`, `schema.sql`, `README.md` (only the parts it needs).

## 5. App Shell
**Purpose:** The empty installable app that every feature plugs into: a header, a bottom tab bar, and a service worker.

**Files**
| File | Job |
|---|---|
| `src/app/layout.tsx` | Root HTML for every page. Renders the page, `TabBar`, and `ServiceWorkerRegister`. Holds iOS home-screen metadata. |
| `src/app/manifest.ts` | Served at `/manifest.webmanifest`. Name, icons, `display: standalone`, `start_url: /groups`. |
| `src/app/page.tsx` | `/` redirects to `/groups`. |
| `src/app/{groups,assistant,settings}/page.tsx` | One placeholder page per tab. |
| `src/components/TabBar.tsx` | Bottom navigation. The `TABS` array is the only list of tabs. |
| `src/components/PageHeader.tsx` | Sticky title bar. |
| `src/components/ServiceWorkerRegister.tsx` | Registers `/sw.js` in the browser. |
| `public/sw.js` | Service worker. Currently only activates. Push handlers are added in the chat step. |
| `public/icons/icon-{192,512}.png` | Placeholder app icons (also used as the iOS icon). |
| `next.config.ts`, `postcss.config.mjs`, `tsconfig.json` | Default config. Tailwind v4 is loaded by `@import "tailwindcss"` in `globals.css`. `@/*` maps to `src/*`. Next rewrites parts of `tsconfig.json` on build (normal). |
| `.claude/launch.json` | Lets Claude's preview browser run `npm run dev` on port 3000. |

**Flow:** Browser opens `/` → redirect to `/groups` → `layout.tsx` wraps the page with the tab bar → service worker registers in the background → browser sees manifest + service worker → offers "Install" / "Add to Home Screen".

**Edge cases**
- The service worker and install prompt only work on `localhost` or HTTPS.
- iOS has no install prompt. Users must use Share → Add to Home Screen.
- `pb-20` on `<main>` keeps content from hiding behind the fixed tab bar. `safe-area-inset-bottom` avoids the iPhone home indicator.

**How to add or remove a tab:** Edit `TABS` in `TabBar.tsx` and add or delete `src/app/<tab>/`.

## 6. Features
Each feature follows this template: **Purpose → Files → Data → Flow → Edge cases → How to remove.**

### 6.1 auth
Not built.

### 6.2 chat
Not built.

### 6.3 i18n
Not built.

### 6.4 assistant
Not built.

## 7. Database
Not built. Tables are listed here per feature.

## 8. Environment Variables
| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | auth (planned) | Supabase project URL. Stored in `.env.local` (gitignored). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | auth (planned) | Public anon key. Safe in the browser because row-level security protects the data. |

## 9. Setup & Deploy
1. Install Node.js LTS (tested on 24.19.0).
2. Keep the project outside OneDrive (it lives at `C:\Projects\VietCorner PWA`), because syncing `node_modules` causes file-lock errors.
3. `npm install`, then `npm run dev` → http://localhost:3000. Run `npm run build` to type-check.
Deploy: not set up yet.

## 10. Change Log
- 2026-09-14: Created harness files (CLAUDE.md, active_context.md, architecture.md).
- 2026-09-14: Step 0 app shell: Next.js config, manifest, service worker, tab bar, 3 placeholder pages, icons.
- 2026-09-14: Project moved to `C:\Projects`. Dependencies installed, build verified. Git initialized. Supabase packages + `.env.local` placeholder added for Step 1.
