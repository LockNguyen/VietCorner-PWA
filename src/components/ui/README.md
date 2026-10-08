# UI components

The shared building blocks every screen is made from. Read this before writing a component: if one here does
the job, use it; if one nearly does, add a variant to it.

Rules and the one file shape: the `frontend` skill. Colours, sizes and the full planned list:
[docs/design-system.md](../../../docs/design-system.md). See them all in every state at `/ui`.

| Component | Job | Variants | Props beyond the native element's |
|---|---|---|---|
| `Text` | Any text outside a control | `variant`: `tile`, `body`, `small` · `tone`: `ink`, `subtle`, `danger` | `as`: `p`, `span`, `h1`, `h2`, `h3` |
| `Button` | Any button | `primary`, `quiet`, `danger`, `text` | `pending`, `pendingLabel` |
| `Spinner` | The turning circle | | |

## Being replaced
`ActionButton` is the busy button from before the design system. Screens move to `Button` as each is
restyled; it is deleted when the last one has moved. Do not use it in new code.

## Hooks they rely on (`src/lib/`)
| Hook | Job |
|---|---|
| `usePending` | Which action of a component is on its way; ignores a second tap. Feeds `Button`'s `pending`. |
| `useRefresh` | Reloads the page's data and resolves when it is on screen, so a button stays busy until then. |
