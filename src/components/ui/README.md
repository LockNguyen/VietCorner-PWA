# UI components

The shared building blocks every screen is made from. Read this before writing a component: if one here does
the job, use it; if one nearly does, add a variant to it.

Rules and the one file shape: the `frontend` skill. Colours, sizes and the full planned list:
[docs/design-system.md](../../../docs/design-system.md). See them all in every state at `/ui`.

| Component | Job | Variants | Props beyond the native element's |
|---|---|---|---|
| `Text` | Any text outside a control | `variant`: `tile`, `body`, `small` · `tone`: `ink`, `subtle`, `danger` | `as`: `p`, `span`, `h1`, `h2`, `h3` |
| `Button` | Any button | `primary`, `quiet`, `danger`, `text` | `pending`, `pendingLabel` |
| `TopBar` | The bar at the top: centred title, a slot for icons at each end | | `title`, `left`, `right` |
| `TabBar` | The bar at the bottom: an icon and a word per destination | | `tabs`: `{ href, label, icon, active }[]` |
| `IconLink` | A link shown as an icon alone | `tone`: `onAction`, `ink` | `label` (read by screen readers) |
| `PhotoTile` | A large tile that opens an area; grey stands in for its photo (B32) | | `title`; children are the artwork |
| `ListRow` | One line of any list: picture, title over subtitle, something at the right end. Renders its own `<li>`; put it in a `<ul>`. | `tone`: `normal`, `off` (called off: grey, struck through) | `title`, `subtitle`, `leading`, `trailing`, `current`, and `href` (a link) or `onClick` (a button); either adds a chevron unless `trailing` is passed (`null` for nothing) |
| `Thumbnail` | The picture at the start of a row: a tinted tile holding an icon or a few characters, until photos exist (B32) | | |
| `RowLabel` | A short bold label that starts a row (a time), in a box of one width so the picture and title after it line up on every row | | |
| `SectionHeading` | The small grey heading above a group of rows | | |
| `EmptyState` | What a screen shows with nothing to list | | `message`; children are the next step |
| `SkeletonRow` | A grey stand-in for a `ListRow` while a list loads | | |
| `Banner` | A message about what just happened; a button, so a tap puts it away | `kind`: `success`, `error` | `message`, `more` (how many wait behind it) |
| `Spinner` | The turning circle. Inline, so beside text it centres on the lowercase letters. | | |

## Conventions the list relies on
- A component may render `next/link`'s `Link`, the app's anchor element. It never uses the router's hooks.
- Icons come from `lucide-react` and are passed in as children by the screen; a component does not pick one.
  The one exception is the chevron `ListRow` draws itself: it is part of what a row that opens something looks like.
- `ListRow` does not extend a native element's props, because it is one of three elements (link, button,
  plain) depending on what it does. Its props are the short list in the table.
- The app's own fillings of the frame are in `src/components/`: `PageHeader` (the top bar's contents) and
  `AppTabs` (which tabs exist). They translate and know the addresses; the components here do neither.

## Being replaced
`ActionButton` is the busy button from before the design system. Screens move to `Button` as each is
restyled; it is deleted when the last one has moved. Do not use it in new code.

## Hooks they rely on (`src/lib/`)
| Hook | Job |
|---|---|
| `useSave` | The usual change from tap to result: `usePending`, then the change, `useRefresh`, and a banner saying how it went. Start here. |
| `usePending` | Which action of a component is on its way; ignores a second tap. Feeds `Button`'s `pending`. |
| `useRefresh` | Reloads the page's data and resolves when it is on screen, so a button stays busy until then. |
| `useBanner` | `showBanner({ kind, message, seconds? })` from anywhere. Success stays 2 s, an error 8 s. `BannerProvider` wraps the app once; `src/components/BannerHost.tsx` draws them and handles the stack. |
