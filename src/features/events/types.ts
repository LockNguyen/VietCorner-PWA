import type { Language } from "@/features/i18n/types"; // I18N

// Row shapes from schema.sql, and the shapes the screens actually render.

// The permission that lets someone create, edit, cancel and remove events (schema.sql grants it to "admin").
export const MANAGE_EVENTS = "events.manage";

// What the event IS: when it happens, how often, and whether it is off.
export type EventRow = {
  id: string;
  group_id: string | null; // null = church-wide
  starts_at: string;
  ends_at: string | null;
  repeats_weekly: boolean;
  repeat_until: string | null;
  canceled_at: string | null;
};

// What the event SAYS, in one language. A member downloads their language only.
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

// The same thing after crossing the server → client boundary, where a Date becomes a string.
// The page serializes, `EventSchedule` revives: nothing else needs to know this shape exists.
export type SerializedOccurrence = Omit<Occurrence, "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string | null;
};

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
};

// What the event form holds. Times are church wall time ("YYYY-MM-DDTHH:mm", what a datetime-local input
// uses) and every field is a string the admin can still be typing; draft.ts turns it into rows.
export type EventDraft = {
  groupId: string | null; // null = church-wide
  startsAt: string;
  endsAt: string; // "" = no end time
  repeatsWeekly: boolean;
  repeatUntil: string; // YYYY-MM-DD, "" = no end
  texts: Record<Language, { title: string; description: string; location: string }>;
};

// The groups an event can be for. The page passes them in, so this feature never imports `groups`.
export type EventGroup = { id: string; name: string };
