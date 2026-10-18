# UI components

The shared building blocks every screen is made from. Read this before writing a component: if one here does
the job, use it; if one nearly does, add a variant to it.

Rules and the one file shape: the `frontend` skill. Colours, sizes and the full planned list:
[docs/design-system.md](../../../docs/design-system.md). See them all in every state at `/ui`.

| Component | Job | Variants | Props beyond the native element's |
|---|---|---|---|
| `Text` | Any text outside a control | `variant`: `tile`, `body`, `small` · `tone`: `ink`, `subtle`, `danger` | `as`: `p`, `span`, `h1`, `h2`, `h3` |
| `Button` | Any button | `primary`, `quiet`, `danger`, `text`, `dangerText` (the small red line under a sheet's or screen's main button: remove, delete, call off), `inline` (blue words with no side padding, lined up with the text above: a phone number) | `pending`, `pendingLabel` |
| `TopBar` | The bar at the top: centred title, a slot for icons at each end | | `title`, `left`, `right` |
| `TabBar` | The bar at the bottom: an icon and a word per destination | | `tabs`: `{ href, label, icon, active }[]` |
| `IconLink` | A link shown as an icon alone, on the top bar | | `label` (read by screen readers) |
| `PhotoTile` | A large tile that opens an area: a photo under a dark veil (`src`), or flat grey without one | | `title`, `src`; children are the artwork above the title |
| `ListRow` | One line of any list: picture, title over subtitle, something at the right end. Renders its own `<li>`; put it in a `<ul>`. | `tone`: `normal`, `off` (called off: grey, struck through) | `title`, `subtitle`, `leading`, `trailing`, `current`, and `href` (a link) or `onClick` (a button); either adds a chevron unless `trailing` is passed (`null` for nothing); the `current` one of a set of choices ends in a tick |
| `Thumbnail` | The picture at the start of a row: `src` cropped to fill the tile, or a tinted tile holding an icon or a few characters | | `src` |
| `SectionHeading` | The small grey heading above a group of rows | | |
| `EmptyState` | What a screen shows with nothing to list | | `message`; children are the next step |
| `SkeletonRow` | A grey stand-in for a `ListRow` while a list loads | | |
| `Field` | A label above one control; under it, what is wrong, once the form has been tried | | `label`, `problem` |
| `TextInput` | One line of typed input. Also a date, a time, or both: set `type` | | |
| `TextArea` | Several lines of typed input | | |
| `Select` | One choice from a list, in the phone's own picker; children are `<option>`s | | |
| `Switch` | On or off, with its label; the whole line is the tap target. A checkbox underneath. | | `label` |
| `Sheet` | A short choice or a few details, rising from the bottom (built on `vaul`). At most 60% of the screen (`max-h-sheet`): the title and X stay put, the rest scrolls. Closes on the X, a swipe down, a tap outside or Escape, always sliding away first; `onClose` runs once it is gone. Children may be a function that receives `close`, for an action that ends by closing (Post). | | `title`, `closeLabel`, `onClose` |
| `CountPill` | A small grey pill with a number and an icon ("3 🙏"), the height and grey of the small `Chip`, so they sit level. Not a button | | `label` (read by screen readers) |
| `Celebrate` | A moment of thanks around what it wraps: it pops in, a ring spreads out and fades, `burst` floats up and fades. Plays once when rendered; nothing moves with reduced motion | | `burst` |
| `Card` | A large tappable card: a picture across the top, always 16:9 (a taller or wider picture is centred and cut, so every card is the same height), then a title with an optional badge before it, a grey line, and children | | `src`, `placeholder`, `title`, `badge`, `subtitle` |
| `IconLine` | One fact with an icon at its left instead of a word (time, place, contact); the icon is labelled for screen readers | | `icon`, `label` |
| `LiveDot` | A small green dot with a light green ring pulsing out of it: something lively. Decorative | | |
| `MemberCircles` | A row of small circles, one per person: initials first, empty figures for the rest, "+N" past `max` | | `initials`, `total`, `max`, `label` |
| `BilingualInput` | One text in two languages as one grey box: the first language on top, a hairline, the other below; an empty half shows its language | | `top`, `bottom` (`value`, `onChange`, `placeholder`, `label`), `rows` |
| `LogoMark` | The stand-in logo: the app's own icon file | | |
| `Avatar` | A person's picture: the same default one for everybody until pictures can be set | | |
| `Bubble` | One message, at most 70% wide | `tone`: `mine`, `theirs`, `failed` | |
| `BubbleRun` | One speaker's messages in a row: the name above, the avatar beside the last. Runs are 16 apart (the parent's gap). | `side`: `mine`, `theirs` | `name`, `avatar` |
| `TimeLine` | A small centred label between messages: a time, or a week | | |
| `Composer` | Where a message is written: a pill field and send, held at the bottom above the tabs. Leaves room for its own row under the messages; a screen that adds children above the field adds room for those. | | `value`, `onChange`, `onSend`, `placeholder`, `sendLabel`, `disabled`, `maxLength`; children sit above the field |
| `IconButton` | A button shown as an icon alone | `tone`: `action`, `filled`, `danger` · `size`: `regular`, `large` | `label` (read by screen readers) |
| `Chip` | A round button beside a bubble: Pray, the tick once given, the author's small grey pencil | `tone`: `pray`, `done`, `quiet` · `size`: `regular`, `small` (32, below `touch`: asked for) | `label` (read by screen readers) |
| `Banner` | A message about what just happened; a button, so a tap puts it away. With an action, the message ends in a link and the cross is its own button | `kind`: `success`, `error` | `message`, `more` (how many wait behind it), `actionLabel` + `onAction` |
| `ProgressBar` | How far along a series of steps: a grey track filling with `action` from the left. Its width is the one inline style in the kit (a computed value). | | `value`, `max` |
| `Spinner` | The turning circle. Inline, so beside text it centres on the lowercase letters. | | |
| `PhotoStrip` | A row of pictures that scrolls sideways and fades out at the right. Children are `PhotoThumb`s (and other `<li>`s). | | |
| `PhotoThumb` | One small square picture in a strip, cropped to fill; a button. Three tenths of the strip wide, so a fourth shows its edge. | | `src`, `alt` |
| `Lightbox` | One picture, whole, over a darkened screen, with arrows to its neighbours and an X. Open while rendered; Escape closes. Children go under the caption. | | `src`, `alt`, `caption`, `labels`, `onPrevious`, `onNext`, `onClose` |

## Conventions the list relies on
- A component may render `next/link`'s `Link`, the app's anchor element. It never uses the router's hooks.
- Icons come from `lucide-react` and are passed in as children by the screen; a component does not pick one.
  The exceptions, each part of what the component is: the chevron and the tick of a `ListRow`, the
  figure inside `Avatar`, and the arrow on `Composer`'s send button.
- `ListRow` does not extend a native element's props, because it is one of three elements (link, button,
  plain) depending on what it does. Its props are the short list in the table.
- `TextInput`, `TextArea` and `Select` share one look, the constant in `controlLook.ts`. It is the only file
  here that is not a component.
- `Sheet` and `Lightbox` are the only components built on a library (`@radix-ui/react-dialog`): keeping focus inside an
  overlay and telling a screen reader about it is easy to get subtly wrong by hand.
- Which button: `primary` for the one main action of a screen or sheet, `danger` for what cannot be undone
  from the app, `quiet` for everything else, `text` for backing out.
- The app's own fillings of the frame are in `src/components/`: `PageHeader` (the top bar's contents) and
  `AppTabs` (which tabs exist). They translate and know the addresses; the components here do neither.

## Hooks they rely on (`src/lib/`)
| Hook | Job |
|---|---|
| `useSave` | The usual change from tap to result: `usePending`, then the change, `useRefresh`, and a banner saying how it went. Start here. |
| `usePending` | Which action of a component is on its way; ignores a second tap. Feeds `Button`'s `pending`. |
| `useRefresh` | Reloads the page's data and resolves when it is on screen, so a button stays busy until then. |
| `useGoTo` | Moves to another screen and resolves when it is drawn: for a save that ends by leaving. |
| `useFresh` | A list shows what the page loaded, then re-reads itself on arrival and on return to the app. |
| `useScrollToEnd` | Keeps the newest message of a conversation in view. |
| `useBanner` | `showBanner({ kind, message, seconds? })` from anywhere. Success stays 2 s, an error 8 s. `BannerProvider` wraps the app once; `src/components/BannerHost.tsx` draws them and handles the stack. |

2026-10-14: `IconButton` has the tone `onDark` (a plain white icon, no circle, over a dark veil). `Lightbox` puts
download (`onDownload`) and a white X above the picture's top-right corner, the arrows under it at its left and
right edges with the caption between them, and closes on a tap on the dark around it.
2026-10-17: `Lightbox` also turns on a swipe: left = next picture, right = the one before (`hooks/useSwipe`, at
least 50 px and more sideways than up or down). Since the same day it drags: the picture follows the thumb, slides
away and in, springs back, and moves a third as far where there is no picture that way.
