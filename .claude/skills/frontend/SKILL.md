---
name: frontend
description: Build or change anything a user sees — a shared UI component in src/components/ui/, or a feature's screen in src/features/*/components/. Use for every .tsx change, any styling, and any new control, layout, colour or text style.
---

# Frontend

Two kinds of component, and they never trade jobs:

| Kind | Lives in | Knows about | Never |
|---|---|---|---|
| **UI component** | `src/components/ui/` | How one thing looks and behaves | A feature, data, a request, the router, translations |
| **Feature component** | `src/features/<name>/components/` | What this screen shows and which actions it offers | Colours, type sizes, borders, raw `<button>` / `<input>` |

Logic belongs to neither. A request, an effect, a timer, or a rule goes in a hook (`hooks/`, or `src/lib/`
when two features need it). A component keeps at most trivial view state: a draft string, open or closed.

## 1. Before writing
- Read `src/components/ui/README.md`. If a component does the job, use it. If one nearly does, add a
  **variant** to it. A second component for the same job is a defect.
- Read `docs/design-system.md`: the tokens, the component list, the rules that span components. If the
  decision you need is not there, **ask**; do not invent a colour, size, radius or spacing. The reasons
  are in `docs/design-questions.md`.

## 2. The one shape of a UI component
Every file in `src/components/ui/` has these parts, in this order, and nothing else:

```tsx
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

const BASE = "inline-flex items-center justify-center rounded-control font-medium";
const VARIANTS = {
  primary: "bg-action text-on-action",
  quiet: "border border-line text-ink",
  danger: "bg-danger text-on-danger",
} as const;
const SIZES = { regular: "min-h-touch px-4 text-body", small: "min-h-9 px-3 text-small" } as const;

// A button. What it does is the caller's; how it looks is here.
export default function Button({ variant = "primary", size = "regular", ...button }: Props) {
  return <button {...button} className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]}`} />;
}
```

1. Imports → `type Props` → class constants (`BASE`, `VARIANTS`, `SIZES`) → one comment → the component.
2. One component per file, default export, file name = component name.
3. `Props` extends the native element's attributes and the rest is spread onto that element, so it works
   wherever the element would.
4. Looks vary only through closed unions (`variant`, `size`), read from a constant map. No boolean look
   props (`primary`, `big`), no `className` prop, no `style`.
5. Classes use design tokens only (`bg-action`, `text-ink`, `rounded-control`), never a palette colour
   (`bg-blue-500`), a hex value or an arbitrary value (`p-[13px]`).
6. Text arrives as `children` or a prop. No `useLanguage`, no strings of its own.
7. No `useState`, `useEffect`, `fetch`, router hooks or Supabase (`Link` is fine: it is an element). Behaviour a component needs (close on Escape)
   is a hook beside it in `src/components/ui/hooks/`.
8. Spacing between components belongs to the parent (`gap`), never to the component (`margin`).

## 3. Feature components
- Compose UI components and lay them out. Tailwind here is **layout only**: flex, grid, gap, padding, width.
- Read text through `t(STRINGS.x)` and pass it down. Call hooks and `api.ts` from event handlers.
- A button that starts a request goes through `useSave` (busy state, reload, a banner saying how it went;
  `docs/adding-a-feature.md`). No result is shown as text beside a button. One row of a list is its own component.
- `@/lib/supabase/*` is never imported here.

## 4. SOLID, as it applies to a component
- **Single job:** one visual thing. If its comment needs "and", split it.
- **Open to extension:** a new look is a new key in `VARIANTS`; callers and other variants do not change.
- **Substitutable:** forwards native props, `ref`-able elements stay native, no surprising required props.
- **Small interface:** no prop that only one caller needs; that caller composes instead.
- **Depends on nothing concrete:** props and callbacks in, JSX out. Replaceable by rewriting one file.

## 5. Comments
- One line above every component and hook, saying what it is for. Most files need no other comment.
- A comment gives the reason, never repeats the code. No comment inside JSX unless a line would be
  misread without it.
- One line, 80% of the time. Two lines is the maximum, and rare. Longer explanations go in the README.

## 6. Always
- Native elements first (`button`, `label`, `dialog`); every input has a visible label.
- Touch targets at least the `touch` token; visible focus; text contrast as set in the design system.
- Check at phone width, in both languages (Vietnamese runs longer), with the longest real content.

## 7. Finish
- Add or update the component's row in `src/components/ui/README.md` (name, job, variants, props).
- Show it: `npm run build`, then the screen in the preview at phone width. Say what was not looked at.
- Then the **verify-and-finish** skill.
