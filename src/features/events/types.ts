import type { Language, Text } from "@/features/i18n/types"; // I18N

// Row shapes from schema.sql, and the shapes the screens actually render.

// The permission that lets someone create, edit, cancel and remove events (schema.sql grants it to "admin").
export const MANAGE_EVENTS = "events.manage";

// What the event IS: when it happens, how often, and whether it is off.
export type EventRow = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  repeats_weekly: boolean;
  repeat_until: string | null;
  canceled_at: string | null;
  thumbnail_path: string | null; // its picture's file in THUMBNAIL_BUCKET; null = none
  contact_phone: string | null; // whom to call about it, as typed: "(336) 555-0101" (schema.sql 3g)
  address: string | null; // the street address behind `location`, one for every language (schema.sql 3g)
};

// What the event SAYS, in one language.
export type EventText = {
  title: string;
  description: string | null;
  location: string | null;
};

export type ChurchEvent = EventRow & { text: EventText };

// One date this event happens on. A weekly event becomes several of these; a one-off becomes one.
// `canceled` covers both kinds: the whole event called off, or this single week skipped.
export type Occurrence = {
  event: ChurchEvent;
  startsAt: Date;
  endsAt: Date | null;
  canceled: boolean;
};

// One row of `upcoming_events()` (schema.sql): an event a member may see, with its words in every language
// it has and the single weeks that were called off. The page and the browser's refresh both read this.
export type ScheduledEvent = EventRow & {
  texts: Partial<Record<Language, EventText>>;
  canceled_dates: string[]; // church calendar dates, YYYY-MM-DD
};

// The one row of `weekly_card` (schema.sql 3h): what the Events tab's first card says above the weekly lines.
export type WeeklyCard = {
  title: string; // in Vietnamese: "Hội Thánh Việt Nam Winston-Salem"
  title_en: string | null; // in English; null = not yet (Vietnamese shows instead)
  address: string | null;
  contact_phone: string | null;
};

// One line of the weekly card: something that happens every week ("Thờ Phượng · 10:30a"). A weekly event
// becomes one; the page adds the groups' meetings in the same shape, so this feature imports nothing of theirs.
export type WeeklyLine = {
  weekday: number; // 0 = Sunday … 6 = Saturday
  time: string; // "HH:MM", church wall clock
  title: string; // already in the reader's language
  href?: string; // where its line leads (a group's page), for a line that has more to show
};

// A weekly line from outside this feature, in both languages (a group's meeting): the page fills it.
export type WeeklyMeeting = Omit<WeeklyLine, "title"> & { title: Text };

// The `events` columns the reminder scheduler asks for (server/sendDueReminders.ts), named once.
export const EVENT_COLUMNS =
  "id, starts_at, ends_at, repeats_weekly, repeat_until, canceled_at, thumbnail_path, contact_phone, address";

// why: the church's own picture behind the weekly card and every event that has none of its own (the user, 2026-10-19).
export const CHURCH_PICTURE = "/images/home/events.png";

// The public storage bucket the events' pictures live in (schema.sql section 3e makes it).
export const THUMBNAIL_BUCKET = "event-thumbnails";

// How long before an event a reminder can be sent, in minutes.
// why: a day to plan, two hours to get ready, thirty minutes to leave. Fixed choices instead of a number
// box: nothing to mistype, and the scheduler's 15-minute run is fine enough for the shortest of them.
export const REMINDER_CHOICES = [1440, 120, 30];

// why: the database refuses a longer address (schema.sql 3g); the box stops the typing there. A phone number
// needs no limit here: `ui/PhoneInput` keeps it to ten digits, well under the database's 30 characters.
export const MAX_ADDRESS_LENGTH = 200;

// --- What the admin section works with ---------------------------------------------------------------

// One of an event's next dates, ready to show and to cancel.
export type UpcomingDate = {
  churchDate: string; // YYYY-MM-DD in church time: what a single-week cancellation is recorded under
  startsAt: string; // the instant, as an ISO string
  canceled: boolean;
};

// An event as its manager sees it: the text in every language it has, and its next few dates.
export type ManagedEvent = EventRow & {
  texts: Partial<Record<Language, EventText>>;
  upcoming: UpcomingDate[];
  reminderMinutes: number[]; // which of REMINDER_CHOICES are switched on
};

// What the event form holds. Times are church wall time ("YYYY-MM-DDTHH:mm", what a datetime-local input
// uses) and every field is a string the admin can still be typing; draft.ts turns it into rows.
export type EventDraft = {
  startsAt: string;
  endsAt: string; // "" = no end time
  repeatsWeekly: boolean;
  repeatUntil: string; // YYYY-MM-DD, "" = no end
  contactPhone: string; // "" = none
  address: string; // "" = none
  texts: Record<Language, { title: string; description: string; location: string }>;
};
