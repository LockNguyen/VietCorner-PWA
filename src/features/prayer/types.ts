// One row of the `prayer_feed` view (schema.sql): a request as a member of its group is allowed to see it.
export type PrayerRequest = {
  id: string;
  group_id: string;
  group_name: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  is_mine: boolean; // decided by the database, so the author's id never reaches the browser
  author_email: string | null; // null when the request is anonymous
};

// What the composer sends. Who wrote it comes from the login token, never from here.
export type NewPrayerRequest = {
  groupId: string;
  body: string;
  isAnonymous: boolean;
};

// The groups a member may post to. The page passes them in, so this feature never imports `groups`.
export type PostableGroup = { id: string; name: string };

// The view's columns, named once so the server's first page and the browser's later pages cannot drift.
export const FEED_COLUMNS =
  "id, group_id, group_name, body, is_anonymous, created_at, is_mine, author_email";

// why: enough to fill several screens of a phone, small enough to arrive fast on a slow connection.
// Older requests load when the reader reaches the bottom.
export const PAGE_SIZE = 20;

// why: the database rejects anything longer (schema.sql); the composer stops the typing at the same number.
export const MAX_BODY_LENGTH = 1000;

// --- Reminders (admin configuration) ---------------------------------------------------------------------

// The permission that lets someone set when groups are reminded to pray (schema.sql grants it to "admin").
export const MANAGE_PRAYER_REMINDERS = "prayer.reminders";

// One weekly nudge for one group (a row of `prayer_reminders`).
export type PrayerReminder = {
  id: string;
  group_id: string;
  weekday: number; // 0 = Sunday … 6 = Saturday
  send_at: string; // "HH:MM:SS", church time
};
