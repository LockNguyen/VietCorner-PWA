# Design questions and decisions

Every visual and structural decision for the UI/UX revamp, in one place. Nothing is implemented until its
question here has an answer. When all are answered, the decided values move into `docs/design-system.md`
(the file the `frontend` skill reads) and this file becomes the record of why.

**Status of each answer**
- **REF** — taken from the reference app. Decided unless you object.
- **PROPOSED** — the reference does not show it; my proposal, consistent with what it does show. Needs your yes.
- **YOU** — only you can answer.
- **DECIDED** — answered or agreed by you (2026-10-08). Every proposal was agreed on that date; the decided
  values are collected in [design-system.md](design-system.md).

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

### The second reference: Facebook Messenger (two screenshots, 2026-10-08)

Followed for **how chat and sign-in are laid out**. The colours, top bar and type stay the first reference's.

| Element | What the screenshots show |
|---|---|
| **Bubbles** | Others at the left: light grey, dark text. Mine at the right: blue, white text. Fully rounded ends (a pill, about 18 pt), comfortable padding, never wider than about 70% of the screen. |
| **Runs** | Messages from one person in a row sit close together (about 4 pt); a change of speaker gets a clear gap (about 16 pt). That gap, not a line, is what separates turns. |
| **Avatar** | A small round picture at the left of the **last** bubble of another person's run, not on every bubble. None beside my own. |
| **Times** | No time on each bubble. The conversation stays uncluttered. |
| **Composer** | One row fixed at the bottom: a pill-shaped light-grey field with a short hint, and the send action at its right. |
| **Sign-in** | White screen. The logo centred with a lot of air above and below. One bold centred sentence saying what to do. Light-grey filled fields with the hint inside, no border. Full-width buttons, softly rounded (about 12 pt). A quiet text link at the bottom. Nothing else on the screen. |

**Where the two references disagree** (see F11, F12): Messenger's controls are soft (pill bubbles, 12 pt
fields and buttons, hints inside fields); the first reference is nearly square (4 pt) and shows no
controls at all.

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
| 4 | Does our church have a logo, colours or printed materials to match? | No logo yet. A generic placeholder mark is used; the real logo is chosen once the app's look is settled. | DECIDED |
| 5 | Is the elderly member on a phone the main user, every tie decided for them? | Yes. | REF |

## B. Colour

| # | Question | Answer | Status |
|---|---|---|---|
| 6 | Main colour | One mid-blue, `#1976D2`. The reference's own blue (about `#2196F3`) gives white text a contrast of 3.1, under the standard minimum of 4.5, so this is the nearest blue that passes (4.6). | REF |
| 7 | Background | Pure white. | REF |
| 8 | How colourful | One accent on white, near-black and two greys. | REF |
| 9 | A colour per feature? | No. All features share the one accent. | REF |
| 10 | Dark mode | Not now. The reference is light only. Tokens are named so it can be added later. | DECIDED |
| 11 | Contrast target | Titles and body text at the stricter level (AAA). Grey subtitles at least the standard level (AA), which is darker than the reference's grey. See N5. | DECIDED |
| 12 | Destructive, success, warning colours | A plain red for destructive actions and errors, a green for success, used as text or a filled button only, never as a tinted background. The reference shows none. | DECIDED |

## C. Type

| # | Question | Answer | Status |
|---|---|---|---|
| 13 | Typeface | The phone's system font. It renders Vietnamese diacritics correctly and costs no download. | REF |
| 14 | Base text size | 17 (row titles in the reference). Subtitles 14, top-bar title 17 semibold, tile titles 20 bold. | REF |
| 15 | Can a member choose larger text in Settings? | Yes, but the Settings control is not built now. Every size is defined relative to one root value, so the setting is one number later. | DECIDED |
| 16 | Headings | Restrained: semibold at the same size as content, not large display type. | REF |
| 17 | Capitals-only text | Never. | REF |

## D. Shape, depth and density

| # | Question | Answer | Status |
|---|---|---|---|
| 18 | Corners | Nearly square. About 4 pt on thumbnails and controls; photo tiles square. | REF |
| 19 | Depth | Flat. Hairline dividers and white space; no shadows. | REF |
| 20 | Density | Medium-airy: list rows about 72 pt, 12 pt side padding, 20 pt margins around tiles. | REF |
| 21 | Smallest tappable thing | 48 pt. Rows are taller than that already; this governs buttons and icons. | DECIDED |
| 22 | Between list rows | A hairline divider starting at the row's content, not edge to edge. No cards. | REF |

## E. Icons and imagery

| # | Question | Answer | Status |
|---|---|---|---|
| 23 | Replace the emoji tab icons with a drawn set | Yes. One small icon dependency; which set is Q-L65. | REF |
| 24 | Outline or filled | Outline. The active tab changes colour, not shape. | REF |
| 25 | Does every icon carry a label | In the tab bar, always. Top-bar icons stand alone in the reference; ours get an accessible name. | REF |
| 26 | Photos or illustrations | Yes, many photos: they help elderly members and look good. Placeholders for now. Uploading, storing and caching them is planned separately (backlog B32). | DECIDED |
| 27 | How a person is shown (email today) | By name with an avatar. A default generic avatar until the person sets one. Setting a name or avatar is not built now; the screens are built to show them. Where the name comes from is F1. | DECIDED |

## F. Navigation and layout

| # | Question | Answer | Status |
|---|---|---|---|
| 28 | Six tabs for an admin | Members have four tabs, admins five (Q29). There is no menu (N3). | DECIDED |
| 29 | Which five tabs, in what order, and which opens first | Home, Events, Prayer, Groups, in that order; admins also get Admin. The app opens on **Home**. The assistant and Settings are two icons at the top right of the top bar. | DECIDED |
| 30 | Top bar | Blue, centred white title. Left: nothing, or a back arrow on a sub-screen. Right: the assistant and Settings icons. | DECIDED |
| 31 | Sub-screens | Full screen with a back arrow: every row's chevron implies "go in". Sheets only for a short choice (the prayer options). | REF |
| 32 | Tablet and computer | A centred column at phone width. | DECIDED |
| 33 | Where the language toggle lives | On the login screen and in Settings (reached from the top-right icon). | DECIDED |

## G. Controls and forms (not shown in the reference)

| # | Question | Answer | Status |
|---|---|---|---|
| 34 | Button styles | Four: **primary** (filled blue, white text), **quiet** (white, hairline border, dark text), **danger** (filled red), **text** (blue words, no box). All 48 pt tall, 4 pt corners, flat. | DECIDED |
| 35 | Field labels | Always above the field, in the subtitle grey. | DECIDED |
| 36 | Date and time pickers | The phone's own. | DECIDED |
| 37 | Few choices | Tappable rows with a tick, in the reference's row pattern, when five or fewer; a dropdown beyond that. | DECIDED |
| 38 | When a form says what is wrong | On submit, and then live while the field is being fixed. | DECIDED |
| 39 | On/off settings | Switches, as iPhone settings use. | DECIDED |

## H. Feedback (not shown in the reference)

| # | Question | Answer | Status |
|---|---|---|---|
| 40 | Error banner (backlog B30): top or bottom, timed or tapped away | At the bottom, above the tab bar. It goes away by itself after a time and can be tapped away sooner. Several stack; tapping the stack shows all of them; tapping one removes it. One reusable piece any feature can raise (backlog B30 moves into the revamp). How long it stays is F5. | DECIDED |
| 41 | Announce success ("Saved")? | Yes. Success uses the same banner as errors, in a different colour. | DECIDED |
| 42 | Loading | Grey placeholder rows in the shape of the list being loaded, so the frame never jumps. | DECIDED |
| 43 | Tap feedback (backlog B31): vibration, sound, both, visual only | Not now. Stays in the backlog (B31). | DECIDED |
| 44 | Animation | Subtle: screens slide, sheets rise, nothing bounces. The phone's "reduce motion" setting is honoured. | DECIDED |
| 45 | Empty screens | One plain sentence and, where there is one, the next step as a button. | DECIDED |

## I. Screen by screen

| # | Question | Answer | Status |
|---|---|---|---|
| 46 | Login | Messenger's sign-in layout in the reference's look: white screen, the logo centred near the top, one bold centred sentence, the field, a full-width button, the language choice as quiet text at the bottom. Two steps as today (email, then the code). | DECIDED |
| 47 | Groups | The reference row: a tile at the left, the group's name, a subtitle, a chevron. What the subtitle says (members, last message) is yours; the tile is N2. | REF |
| 48 | Chat: bubbles, times, names | Messenger's layout in the reference's look (see "The second reference" below). Others at the left in light grey with dark text; mine at the right in the accent blue with white text. In a group, the sender's name sits in small grey above the first bubble of their run and their avatar beside the last. The top bar stays the reference's blue bar with a back arrow, not Messenger's white one. | DECIDED |
| 49 | Events | A list in the reference row, grouped by day. No month calendar. | REF |
| 50 | Prayer requests: how they differ from chat | Bubbles like chat, but all at the left, mine included. Grouped by week ("This week", "Last week", "2 weeks ago", …), then by person within a week, anonymous requests together; newest first. Twenty at a time, with "Load more" and a turning circle at the bottom. Open points: F2, F3. | DECIDED |
| 51 | Assistant: its own identity? | Exactly like a group chat for now, with two speakers: the member and the assistant. It will get its own look later. | DECIDED |
| 52 | Settings | Reference rows with chevrons, in short groups. | REF |
| 53 | Admin | The same look as the rest. A fifth tab that only admins see. | DECIDED |

## J. Words

| # | Question | Answer | Status |
|---|---|---|---|
| 54 | How the app addresses people in Vietnamese | No forms of address and no greeting anywhere for now. Text stays neutral, with no pronoun for the reader where Vietnamese allows it. | DECIDED |
| 55 | A native speaker reviews all Vietnamese text? | Yes. All Vietnamese text is reviewed by a native speaker. | DECIDED |

## K. Brand and install

| # | Question | Answer | Status |
|---|---|---|---|
| 56 | Home Screen name and icon of the installed app: see F4. |  | DECIDED |
| 57 | Status bar and splash colour | The accent blue, so the top bar runs to the top of the phone. | REF |

## L. How we build it

| # | Question | Answer | Status |
|---|---|---|---|
| 58 | Roll-out | The frame first (top bar, tab bar, list row), then one feature at a time. | DECIDED |
| 59 | A showcase page of every component, for admins | Yes. | DECIDED |
| 60 | Dialogs, menus, sheets: hand-built or a small unstyled library | A small unstyled library for those three only. | DECIDED |
| 61 | Shared components never translate; the screen passes text in | Yes. | DECIDED |
| 62 | Shared components take no `className` | Yes. | DECIDED |
| 63 | Feature screens style layout only, never colour or type | Yes. | DECIDED |
| 64 | Catching visual breakage | Your review of the showcase page per change; automation later. | DECIDED |
| 65 | Which icon set (one dependency) | An outline set that ships single icons, so only the ones used are downloaded. | DECIDED |

## N. New questions the reference raises

| # | Question | Answer | Status |
|---|---|---|---|
| N1 | **A home screen.** The reference opens on "This week": a banner and big tiles into each area. We open straight on Groups. Do we add a home tab like it, and what are its tiles? | Yes. A Home tab with a house icon and three tiles: Events, Prayer, Groups. It becomes a dashboard later. The app opens on it. | DECIDED |
| N2 | **Thumbnails.** Every reference row has a picture; we have none. Options: (a) admins upload a picture per group and event, which is a new feature (storage, an upload control, moderation); (b) a coloured tile with an icon or the first letter, no upload; (c) no tile at all, text-only rows. | (b) to start: it keeps the row's shape and the left alignment without a new feature. | DECIDED |
| N3 | **The menu.** What sits behind the top-left menu? | No menu for now. | DECIDED |
| N4 | **Tab label size.** Follow the reference's small labels (about 10 pt) exactly, or enlarge them to about 12–13 pt for older eyes? Larger labels with five tabs means short words, especially in Vietnamese. | Enlarge. | DECIDED |
| N5 | **Subtitle grey.** Match the reference's light grey exactly, or darken it until it passes the standard contrast level? | Darken. It keeps the two-level look and stays readable. | DECIDED |
| N6 | **Text over photos.** Only if we use photo tiles (N1): always under a dark overlay strong enough for any photo? | Yes. | DECIDED |
| N7 | **Top-bar actions.** The reference has two icons at the right. Do we want any (add, search), or keep the right side empty until a screen needs one? | Two: the assistant and Settings (Q29). | DECIDED |

## F. Follow-ups from your answers (2026-10-08)

| # | Question | Answer | Status |
|---|---|---|---|
| F0 | **The Messenger screenshots did not arrive.** Q46, Q48, Q50 and Q51 say to mimic them. Please attach them again: the sign-in screen, a group chat, and anything else you want followed. | Received 2026-10-08: a one-to-one chat and the sign-in screen. Recorded below. | DECIDED |
| F1 | **Names, avatars and form of address need a place to live and a moment to be asked.** Today an account is only an email. (a) Is a "What is your name, and how should we address you?" step right after the first sign-in part of this revamp? (b) Which forms of address are offered: cô, chú, bác, anh, chị, ông, bà, em, "by my name"? (c) Where does the app use it: a greeting on Home, notifications? (d) Until someone has answered, they are shown as the part of their email before the @. | A step right after the first sign-in asks for the person's **name only**. No form of address is asked or stored, and nothing greets them. Until someone has answered they are shown as the part of their email before the @. Avatars: a default one for everybody; setting one comes later. | DECIDED |
| F2 | **Prayer grouping.** (a) Week labels: your list has "last month" between "3 weeks ago" and "Week of 10/2/2025", which overlaps both. Proposed rule: This week, Last week, 2 weeks ago, 3 weeks ago, then "Week of <date>". (b) A week starts on Sunday, church time. (c) Inside a week, people are ordered by their newest request. (d) With twenty loaded at a time, a later page can add to a person's group already on screen. | As proposed: This week, Last week, 2 weeks ago, 3 weeks ago, then "Week of <date>"; weeks start on Sunday in church time; people within a week ordered by their newest request; a later page can add to a group already on screen. | DECIDED |
| F3 | **Prayer bubbles.** Where do Pray and the author's X go? Proposed: Pray as a small button under the bubble; the author's options by pressing the X at the bubble's corner, as now. | As proposed. | DECIDED |
| F4 | Home Screen name and icon of the installed app (Q56). | Name on the phone: "Góc Việt" (a Home Screen label fits about twelve characters and cannot change with the language). Full name where there is room: "Góc Việt · VietCorners". Icon: a placeholder mark I draw, until the logo exists. | DECIDED |
| F5 | **How long a banner stays.** Proposed: success 4 seconds, errors 8 seconds, because an error an elderly member did not finish reading is worse than one that lingers. | Success 2 seconds, errors 8 seconds. | DECIDED |
| F6 | **Home tiles.** "The other four pages": Events, Prayer, Groups, and which fourth — the assistant? | Three tiles: Events, Prayer, Groups. | DECIDED |
| F7 | **Opening on Events while there is a Home tab.** The Home tab is first in the bar but the app opens on the second. Intended? The alternative is that Home opens first and shows this week's events on it. | The app opens on Home. | DECIDED |
| F8 | **Banners and forms.** Banners are for what happened after a tap (saved, failed). A form's own hints ("Add a title in at least one language") stay beside the field, where the eye already is. | Yes: hints stay beside the field. The banner is one reusable piece that takes its content as parameters (the message, whether it is a success or an error, how long it stays), so any feature can raise any message through it. | DECIDED |
| F9 | **Top-right icons have no labels** in the reference. It is the one place it breaks "every icon has a word". Keep them bare, or add a small word under each? | Icons only, with names a screen reader announces ("Assistant", "Settings"). | DECIDED |
| F10 | **Placeholder images.** I draw them in code: a neutral mark for the logo, a plain avatar, soft tinted tiles for photos. No downloads needed, and nothing with unclear rights ends up in the app. Real photos from the web need a licence that allows use. | As proposed. | DECIDED |
| F11 | **Corner roundness of controls.** The first reference shows only thumbnails (about 4 pt). Messenger shows the controls themselves: pill bubbles, and fields and buttons at about 12 pt. Proposed: bubbles are pills; fields and buttons 12 pt; thumbnails and tiles stay 4 pt. This replaces the "4 pt corners" in Q18 and Q34 for controls. | As proposed. | DECIDED |
| F12 | **Hints inside fields, or labels above?** Messenger's sign-in puts the hint inside the field. That is fine for one field under a sentence that says what to enter, but in a long form the hint disappears as soon as typing starts. Proposed: sign-in follows Messenger (hint inside, under its sentence); every other form keeps a label above the field (Q35), with the same light-grey filled field. | As proposed. | DECIDED |
| F13 | **Times in chat.** Messenger shows none on bubbles. Proposed: a small centred time line where a conversation resumes after a break (an hour or more), and none on each bubble. | As proposed. | DECIDED |

