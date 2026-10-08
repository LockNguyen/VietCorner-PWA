# Design system

What the app looks like and how its parts are named. The `frontend` skill reads this file before any `.tsx`
changes. The reasons behind each value are in [design-questions.md](design-questions.md); this file is only
the decisions.

**The rule above all:** if a value is not here, ask. Do not invent a colour, size, radius or spacing.

## 1. Principles (from the reference app)
1. One list row, used everywhere.
2. One accent colour, meaning "where am I" and "the main action". Never decoration.
3. A constant frame: the same top bar and tab bar on every screen.
4. Even rhythm: the same paddings and row heights throughout.
5. Two levels of text: a dark title, a grey subtitle.
6. A chevron on everything that opens something.
7. Flat: white, hairlines and space. No shadows.
8. One strict left edge for text.

## 2. Tokens
Defined once in `src/app/globals.css` (`@theme`). Components use the token name, never the value.

### Colour
| Token | Value | Used for | Contrast |
|---|---|---|---|
| `action` | `#1976D2` | Top bar, primary button, my chat bubble, active tab, text buttons | 4.6 with white |
| `on-action` | `#FFFFFF` | Text and icons on any filled colour: `action`, `danger`, `success` | 4.6 or better |
| `surface` | `#FFFFFF` | Every background, including the tab bar | |
| `fill` | `#F0F0F0` | Fields, others' chat bubbles, quiet tiles, loading placeholders | |
| `ink` | `#1A1A1A` | Titles and body text | 17.4 on white, 15.3 on `fill` |
| `subtle` | `#5F5F5F` | Subtitles, labels, inactive tabs, hints inside fields | 6.4 on white, 5.6 on `fill` |
| `line` | `#E0E0E0` | Hairline dividers and quiet borders | |
| `danger` | `#C62828` | Destructive buttons, error banners | 5.6 with white |
| `success` | `#2E7D32` | Success banners | 5.1 with white |

- The reference's own blue (`#2196F3`) gives white text a contrast of 3.1, below the standard minimum of
  4.5, so `action` is the nearest blue that passes. The tab bar is pure white for the same reason.
- No other colour exists. A feature never gets its own.

### Type
The phone's system font. Sentence case; never capitals-only.

| Token | Size | Weight | Used for |
|---|---|---|---|
| `text-tile` | 20 | bold | Home tile titles |
| `text-body` | 17 | regular | Row titles, messages, field text, buttons (medium weight) |
| `text-bar` | 17 | semibold | Top bar title |
| `text-small` | 14 | regular | Subtitles, labels, sender names, time lines |
| `text-tab` | 13 | regular | Tab labels |

Sizes are in `rem` and the root size is `106.25% × --text-scale` (default 1), so a future "larger text"
setting changes one number and the phone's own text-size setting is still respected.

### Space, size and shape
| Token | Value | Used for |
|---|---|---|
| Spacing steps | 4, 8, 12, 16, 20, 24 | The only gaps and paddings (`gap-1` … `gap-6`). 12 = side padding of a row. 20 = screen margin around tiles. Space is in px, so larger text does not push the layout apart. |
| `touch` | 48 | Smallest tappable height and width |
| `row` | 72 | Minimum height of a list row |
| `bar` | 48 | Top bar height (reference: 44; raised so its icons meet `touch`) |
| `tabs` | 56 | Tab bar height, plus the phone's bottom inset |
| `column` | 480 | Widest the content gets; centred on larger screens |
| `radius-thumb` | 4 | Thumbnails, photo tiles |
| `radius-control` | 12 | Buttons, fields, sheets, banners |
| `radius-bubble` | 18 | Chat bubbles |
| `radius-full` | circle | Avatars |

### Motion
Screens slide, sheets rise, banners fade; about 200 ms; nothing bounces. All of it is switched off when the
phone asks for reduced motion.

## 3. The frame
- **Top bar:** `action` background, title centred in `on-action`. Left: empty, or a back arrow on a
  sub-screen. Right: the assistant and Settings icons, with screen-reader names and no visible label.
- **Tab bar:** Home, Events, Prayer, Groups; admins also see Admin. Outline icon above a label. Inactive
  `subtle`, active `action`. The app opens on Home.
- **Sub-screens** (a group's chat, the assistant, Settings, the event editor) are full screens with a back
  arrow. A sheet rising from the bottom is only for a short choice.
- **No menu.**

## 4. Components (`src/components/ui/`)
Each follows the one file shape in the `frontend` skill. Built in the order of the build plan; what exists
today is listed in `src/components/ui/README.md` and shown in every state at `/ui`.

| Group | Component | Job | Variants |
|---|---|---|---|
| Frame | `TopBar` | Title, optional back, right-hand icons. (The centred column is two classes on `layout.tsx`, not a component.) | |
| | `TabBar` | The tabs | |
| Text | `Text` | Every piece of text outside a control | `tile`, `body`, `small`; tone `ink`, `subtle`, `danger` |
| List | `ListRow` | Thumbnail, title, subtitle, trailing chevron or control | link, static |
| | `Thumbnail` | A picture, or a tinted tile with an icon or letter | |
| | `Avatar` | A person's picture: the default one for everybody today | |
| | `PhotoTile` | Home's large tile: artwork and a title on flat grey today; a picture under a dark overlay once photos exist (B32) | |
| | `SectionHeading` | The small grey heading above a group of rows | |
| Controls | `Button` | Any button; shows the turning circle while pending | `primary`, `quiet`, `danger`, `text` |
| | `IconButton` | An icon alone, with a screen-reader name | `action`, `filled`, `danger`; `regular`, `large` (the assistant's microphone) |
| | `Field` | A label above a control and, once the form has been tried, what is wrong with it | |
| | `TextInput`, `TextArea`, `Select` | `fill` background, no border, `radius-control`. A date or a time is a `TextInput` with that `type`: the phone's own picker, so no separate component. | |
| | `Switch` | On / off, with its label on the same line | |
| | `ChoiceList` | Up to five options as rows with a tick. Today this is `ListRow` with a tick as `trailing` (the language choice); it becomes its own component when a second chooser needs it. | |
| Feedback | `Banner` + `useBanner` | Success and error messages at the bottom | `success`, `error` |
| | `Spinner` | The turning circle | |
| | `SkeletonRow` | A grey placeholder in the shape of a `ListRow` | |
| | `EmptyState` | One sentence and, where there is one, the next step | |
| Overlay | `Sheet` | A short choice, or a few details, rising from the bottom | |
| Conversation | `Bubble` | One message | `mine`, `theirs`, `failed` (an answer that did not come) |
| | `BubbleRun` | One speaker's consecutive messages: name above, avatar beside the last | |
| | `Chip` | A reaction on the corner of a bubble (Pray) | `idle`, `done` |
| | `TimeLine` | A small centred time or week label | |
| | `Composer` | The pill field and send button, held at the bottom above the tab bar | |
| Placeholder | `LogoMark` | The stand-in logo until the church has one | |

### Rules that span components
- **Buttons:** `touch` tall, `radius-control`, flat. One `primary` per screen or sheet at most. `danger` is
  for what cannot be undone from the app (remove a group, cancel an event for good, delete a request);
  everything else that changes something is `quiet`; `text` backs out.
- **Fields:** a label above in `text-small` `subtle`. Sign-in is the one exception: its single field has
  the hint inside, under a sentence that says what to enter.
- **Forms** say what is wrong on submit, then live while the field is being fixed. Hints sit beside the
  field, never in a banner.
- **Banners:** at the bottom, above the tab bar. Success stays 2 seconds, errors 8; a tap dismisses one
  sooner. Several stack; tapping the stack shows them all. A feature raises one by calling
  `useBanner()` with the message, the kind and (optionally) how long. No inline red text after an action.
- **Loading:** `SkeletonRow`s in the shape of what is coming; the frame never jumps.
- **Chat, prayer and the assistant** share the conversation components. Others at the left on `fill` with
  `ink` text; mine at the right on `action` with `on-action` text. Bubbles at most 70% wide. 4 between
  bubbles of one run, 16 between runs. No time on a bubble; a `TimeLine` where a conversation resumes after
  an hour or more. Prayer requests are all at the left, mine included, grouped by week and then by person,
  as runs like chat's. Nothing sits between two requests: Pray is a `Chip` on the bubble's corner, my own
  request opens its options when tapped, and the list shows no date or group.
  A banner raised on a chat screen covers the composer until it leaves or is tapped away.
- **People** are shown by name with an `Avatar`; until someone has given a name, the part of their email
  before the @. A row that already carries two buttons (a join request) shows the name without the avatar. Nobody is greeted and no form of address is used.
- **Pictures** are placeholders drawn in code until photos are planned (backlog B32).
- **Icons:** `lucide-react`, outline. Always with a label in the tab bar; alone in the top bar.

## 5. Dependencies this adds
Each is installed in the slice that first uses it, not before.

| Package | Why | Used by |
|---|---|---|
| `lucide-react` | Outline icons, one import per icon, so only those used are shipped | `TabBar`, `TopBar`, `IconButton`, `Thumbnail` |
| `@radix-ui/react-dialog` | Focus handling and screen-reader behaviour for overlays, which are easy to get subtly wrong by hand | `Sheet` only |

## 6. Not decided here
- The church's logo and the app icon: placeholders until the look is settled.
- Dark mode, tap feedback (B31), photos and their cache (B32): later.
- The Vietnamese wording is reviewed by a native speaker before launch.
