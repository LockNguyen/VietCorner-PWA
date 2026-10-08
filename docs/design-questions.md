# Design questions and decisions

Every visual and structural decision for the UI/UX revamp, in one place. Nothing is implemented until its
question here has an answer. When all are answered, the decided values move into `docs/design-system.md`
(the file the `frontend` skill reads) and this file becomes the record of why.

**Status of each answer**
- **REF** — taken from the reference app. Decided unless you object.
- **PROPOSED** — the reference does not show it; my proposal, consistent with what it does show. Needs your yes.
- **YOU** — only you can answer.

---

## The reference: First Baptist Church Kannapolis app (three screenshots, 2026-10-08)

"I want our app to look exactly like this." We follow its **patterns** (layout, spacing, colour use,
navigation). We do not copy its logo, photos or name: those are another church's.

The screenshots are 230 px wide, so every measurement below is scaled to a standard 375-point phone and is
approximate (±2 points). They are starting values to be checked on a real phone, not facts.

### What it does

| Element | What the screenshots show |
|---|---|
| **Top bar** | Solid mid-blue, full width, about 44 pt tall. Title centred, white, semibold, about 17 pt. One white icon at the left (menu), one or two at the right. No border, no shadow. The phone's status bar is the same blue. |
| **Tab bar** | Five tabs, never more. Off-white background, a hairline on top, about 50 pt tall. Outline icon above a small label (about 10 pt). Inactive = mid-grey. Active = the same blue, icon and label. No pill, no underline. |
| **List row** | The one pattern every list uses. About 72 pt tall. Left: a thumbnail, about 90 × 60 pt, corners rounded about 4 pt. Then a title (about 17 pt, near-black, regular weight) over a subtitle (about 14 pt, mid-grey). Right: a pale grey chevron. A hairline divider between rows, starting at the thumbnail's left edge. |
| **Home ("This week")** | A full-width banner image under the top bar, then a column of large photo tiles: about 20 pt side margins, about 120 pt tall, about 24 pt apart, square corners, a white bold title (about 20 pt) and a small white subtitle centred over a darkened photo. |
| **Background** | Pure white everywhere. No tinted page, no cards floating on grey. |
| **Colour** | One accent, the blue, used for the top bar and the active tab only. Everything else is white, near-black and two greys. All other colour comes from photos. |
| **Type** | The phone's system font. Sentence case everywhere, no capitals-only text. Two weights: regular for content, semibold for the top bar and tile titles. |
| **Depth** | Flat. No shadows, no gradients on controls, no outlined cards. Separation is by hairlines and white space. |
| **Left edge** | Thumbnails start about 12 pt from the screen edge and every title starts at the same x on every row and every screen. |

### Why it is easy on the eyes (the patterns we must keep)

1. **One row, used everywhere.** "Connect" and "Recent Media" are different content in the identical row.
   Learn one, read them all.
2. **One accent colour, used in two places.** Blue means "where am I" (top bar, active tab). It is never
   decoration, so it never competes with content.
3. **A constant frame.** The top bar and tab bar are identical on every screen; only the middle changes.
4. **Generous, even rhythm.** Rows about 72 pt, the same padding on every one. Nothing is cramped, and
   nothing is spaced differently from its neighbour.
5. **Two levels of text, no more.** A dark title and a grey subtitle. Size and colour do the work; there is
   no bold-versus-regular noise inside a list.
6. **A chevron means "this opens something".** Every tappable row has one, so nobody has to guess.
7. **Icons always have a word under them.**
8. **One strict left alignment** for text, down the whole screen.
9. **Flat and quiet.** No shadows, borders or badges asking for attention. Photos are the only decoration.
10. **Five destinations.** Everything else is behind the menu, not squeezed into the bar.

### Where I would not follow it exactly (your call: N4–N6)

- **Tab labels are about 10 pt.** That is small for elderly eyes. Ours also run longer in Vietnamese.
- **The grey subtitle is light.** It may fall under the contrast level recommended for older readers.
- **White text over photos** depends on the photo. Over a pale image it disappears.
- **A hamburger menu hides things.** People who do not explore menus never find what is inside.

### What the screenshots do not show

No form, button, text field, dialog, error, loading state, chat, or empty screen appears in them. Sections
G, H and most of I below cannot be answered from the reference; those are marked PROPOSED and follow its
rules (flat, one accent, system font, the same paddings).

---

## A. Who it is for and how it should feel

| # | Question | Answer | Status |
|---|---|---|---|
| 1 | Three words a member should use for it | Clean, clear, calm. (Your words: "pleasing on the eyes", "clear and easy", "clean and consistent".) | REF |
| 2 | A church's app, or a neutral community app | A church's app: the reference leads with the church's name and imagery. | REF |
| 3 | An app to be close to | First Baptist Church Kannapolis, as above. | REF |
| 4 | Does our church have a logo, colours or printed materials to match? | | YOU |
| 5 | Is the elderly member on a phone the main user, every tie decided for them? | Yes. | REF |

## B. Colour

| # | Question | Answer | Status |
|---|---|---|---|
| 6 | Main colour | One mid-blue, close to the reference's (about `#2196F3`, which is already our status-bar colour). Final shade after Q4 and a contrast check with white text. | REF |
| 7 | Background | Pure white. | REF |
| 8 | How colourful | One accent on white, near-black and two greys. | REF |
| 9 | A colour per feature? | No. All features share the one accent. | REF |
| 10 | Dark mode | Not now. The reference is light only. Tokens are named so it can be added later. | PROPOSED |
| 11 | Contrast target | Titles and body text at the stricter level (AAA). Grey subtitles at least the standard level (AA), which is darker than the reference's grey. See N5. | PROPOSED |
| 12 | Destructive, success, warning colours | A plain red for destructive actions and errors, a green for success, used as text or a filled button only, never as a tinted background. The reference shows none. | PROPOSED |

## C. Type

| # | Question | Answer | Status |
|---|---|---|---|
| 13 | Typeface | The phone's system font. It renders Vietnamese diacritics correctly and costs no download. | REF |
| 14 | Base text size | 17 (row titles in the reference). Subtitles 14, top-bar title 17 semibold, tile titles 20 bold. | REF |
| 15 | Can a member choose larger text in Settings? | | YOU |
| 16 | Headings | Restrained: semibold at the same size as content, not large display type. | REF |
| 17 | Capitals-only text | Never. | REF |

## D. Shape, depth and density

| # | Question | Answer | Status |
|---|---|---|---|
| 18 | Corners | Nearly square. About 4 pt on thumbnails and controls; photo tiles square. | REF |
| 19 | Depth | Flat. Hairline dividers and white space; no shadows. | REF |
| 20 | Density | Medium-airy: list rows about 72 pt, 12 pt side padding, 20 pt margins around tiles. | REF |
| 21 | Smallest tappable thing | 48 pt. Rows are taller than that already; this governs buttons and icons. | PROPOSED |
| 22 | Between list rows | A hairline divider starting at the row's content, not edge to edge. No cards. | REF |

## E. Icons and imagery

| # | Question | Answer | Status |
|---|---|---|---|
| 23 | Replace the emoji tab icons with a drawn set | Yes. One small icon dependency; which set is Q-L65. | REF |
| 24 | Outline or filled | Outline. The active tab changes colour, not shape. | REF |
| 25 | Does every icon carry a label | In the tab bar, always. Top-bar icons stand alone in the reference; ours get an accessible name. | REF |
| 26 | Photos or illustrations | The reference leans on photos: every row has a thumbnail and the home screen is photo tiles. We have none. See N2. | YOU |
| 27 | How a person is shown (email today) | | YOU |

## F. Navigation and layout

| # | Question | Answer | Status |
|---|---|---|---|
| 28 | Six tabs for an admin | Five at most. What does not fit goes behind the top bar's menu. Which five is Q29. | REF |
| 29 | Which five tabs, in what order, and which opens first | | YOU |
| 30 | Top bar | Blue, centred white title, a menu icon at the left, at most two icons at the right. On a sub-screen the left icon is a back arrow. | REF |
| 31 | Sub-screens | Full screen with a back arrow: every row's chevron implies "go in". Sheets only for a short choice (the prayer options). | REF |
| 32 | Tablet and computer | A centred column at phone width. | PROPOSED |
| 33 | Where the language toggle lives | In the menu and on the login screen. | PROPOSED |

## G. Controls and forms (not shown in the reference)

| # | Question | Answer | Status |
|---|---|---|---|
| 34 | Button styles | Four: **primary** (filled blue, white text), **quiet** (white, hairline border, dark text), **danger** (filled red), **text** (blue words, no box). All 48 pt tall, 4 pt corners, flat. | PROPOSED |
| 35 | Field labels | Always above the field, in the subtitle grey. | PROPOSED |
| 36 | Date and time pickers | The phone's own. | PROPOSED |
| 37 | Few choices | Tappable rows with a tick, in the reference's row pattern, when five or fewer; a dropdown beyond that. | PROPOSED |
| 38 | When a form says what is wrong | On submit, and then live while the field is being fixed. | PROPOSED |
| 39 | On/off settings | Switches, as iPhone settings use. | PROPOSED |

## H. Feedback (not shown in the reference)

| # | Question | Answer | Status |
|---|---|---|---|
| 40 | Error banner (backlog B30): top or bottom, timed or tapped away | | YOU |
| 41 | Announce success ("Saved")? | | YOU |
| 42 | Loading | Grey placeholder rows in the shape of the list being loaded, so the frame never jumps. | PROPOSED |
| 43 | Tap feedback (backlog B31): vibration, sound, both, visual only | iPhones do not let a web app vibrate. | YOU |
| 44 | Animation | Subtle: screens slide, sheets rise, nothing bounces. The phone's "reduce motion" setting is honoured. | PROPOSED |
| 45 | Empty screens | One plain sentence and, where there is one, the next step as a button. | PROPOSED |

## I. Screen by screen

| # | Question | Answer | Status |
|---|---|---|---|
| 46 | Login | The church's name or logo above the form, on white. Depends on Q4. | YOU |
| 47 | Groups | The reference row: a tile at the left, the group's name, a subtitle, a chevron. What the subtitle says (members, last message) is yours; the tile is N2. | REF |
| 48 | Chat: bubbles, times, names | Not shown. | YOU |
| 49 | Events | A list in the reference row, grouped by day. No month calendar. | REF |
| 50 | Prayer requests: how they differ from chat | Not shown. | YOU |
| 51 | Assistant: its own identity? | Not shown. | YOU |
| 52 | Settings | Reference rows with chevrons, in short groups. | REF |
| 53 | Admin | The same look as the rest; it lives behind the menu, not in the tab bar. | REF |

## J. Words

| # | Question | Answer | Status |
|---|---|---|---|
| 54 | How the app addresses people in Vietnamese | | YOU |
| 55 | A native speaker reviews all Vietnamese text? | | YOU |

## K. Brand and install

| # | Question | Answer | Status |
|---|---|---|---|
| 56 | Home Screen name and icon | | YOU |
| 57 | Status bar and splash colour | The accent blue, so the top bar runs to the top of the phone. | REF |

## L. How we build it

| # | Question | Answer | Status |
|---|---|---|---|
| 58 | Roll-out | The frame first (top bar, tab bar, list row), then one feature at a time. | PROPOSED |
| 59 | A showcase page of every component, for admins | Yes. | PROPOSED |
| 60 | Dialogs, menus, sheets: hand-built or a small unstyled library | A small unstyled library for those three only. | PROPOSED |
| 61 | Shared components never translate; the screen passes text in | Yes. | PROPOSED |
| 62 | Shared components take no `className` | Yes. | PROPOSED |
| 63 | Feature screens style layout only, never colour or type | Yes. | PROPOSED |
| 64 | Catching visual breakage | Your review of the showcase page per change; automation later. | PROPOSED |
| 65 | Which icon set (one dependency) | An outline set that ships single icons, so only the ones used are downloaded. | PROPOSED |

## N. New questions the reference raises

| # | Question | Answer | Status |
|---|---|---|---|
| N1 | **A home screen.** The reference opens on "This week": a banner and big tiles into each area. We open straight on Groups. Do we add a home tab like it, and what are its tiles? | | YOU |
| N2 | **Thumbnails.** Every reference row has a picture; we have none. Options: (a) admins upload a picture per group and event, which is a new feature (storage, an upload control, moderation); (b) a coloured tile with an icon or the first letter, no upload; (c) no tile at all, text-only rows. | (b) to start: it keeps the row's shape and the left alignment without a new feature. | PROPOSED |
| N3 | **The menu.** What sits behind the top-left menu: Settings, Admin, language, sign out? | | YOU |
| N4 | **Tab label size.** Follow the reference's small labels (about 10 pt) exactly, or enlarge them to about 12–13 pt for older eyes? Larger labels with five tabs means short words, especially in Vietnamese. | Enlarge. | PROPOSED |
| N5 | **Subtitle grey.** Match the reference's light grey exactly, or darken it until it passes the standard contrast level? | Darken. It keeps the two-level look and stays readable. | PROPOSED |
| N6 | **Text over photos.** Only if we use photo tiles (N1): always under a dark overlay strong enough for any photo? | Yes. | PROPOSED |
| N7 | **Top-bar actions.** The reference has two icons at the right. Do we want any (add, search), or keep the right side empty until a screen needs one? | Empty until needed. | PROPOSED |
