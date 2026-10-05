// Row shapes from schema.sql, and the shape the list actually renders.

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
