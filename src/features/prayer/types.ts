import type { Language } from "@/features/i18n/types"; // I18N

// One row of the `prayer_feed` view (schema.sql): a request as every approved member sees it.
export type PrayerRequest = {
  id: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  is_mine: boolean; // decided by the database, so the author's id never reaches the browser
  prayer_count: number; // how many prayed, for every reader since 2026-10-22 (schema.sql 5c; 5b gave it to the author only)
  author_name: string | null; // null when the request is anonymous
  author_avatar: string | null; // their picture's path in the profiles' AVATAR_BUCKET; null when anonymous or none
  language: Language | null; // the original's, found by the AI service; null until known (schema.sql 5d)
  translation: string | null; // into the other language, only once an admin approved it; else null
};

// One request on the admin's review list (schema.sql 5d `prayer_translations_to_review`): its words, and the
// translation waiting for approval, which is null when the AI service could not translate it.
export type TranslationToReview = {
  id: string;
  body: string;
  language: Language | null;
  translation: string | null;
  created_at: string;
};

// Who reviews translations before members see them (schema.sql 5d grants it to admins).
export const REVIEW_TRANSLATIONS = "prayer.translations";

// why: the database rejects a longer translation (schema.sql 5d); a translation can run longer than its original.
export const MAX_TRANSLATION_LENGTH = 2000;

// What the composer sends. Who wrote it comes from the login token, never from here.
export type NewPrayerRequest = {
  body: string;
};

// The view's columns, named once so the server's first page and the browser's later pages cannot drift.
export const FEED_COLUMNS =
  "id, body, is_anonymous, created_at, is_mine, author_name, prayer_count, author_avatar, language, translation";

// why: enough to fill several screens of a phone, small enough to arrive fast on a slow connection.
// Older requests load when the reader reaches the bottom.
export const PAGE_SIZE = 20;

// why: the database rejects anything longer (schema.sql); the composer stops the typing at the same number.
export const MAX_BODY_LENGTH = 1000;

// The worship songs the Prayer tab plays while members pray, in the order playlist.ts picks: files the church
// has the rights to, added by hand to public/audio/worship/ and named here (the prayer README). A song is
// downloaded only when it starts, so a longer list costs the app nothing until it plays. `songs.test.ts` fails
// when this list and the folder disagree (2026-10-22: the folder's files were replaced and Play found nothing).
export const WORSHIP_FOLDER = "/audio/worship/";
export const WORSHIP_SONGS = [
  "Be Thou My Vision.mp3",
  "Count Your Blessings.mp3",
  "Higher Ground.mp3",
  "Jesus Loves Me.mp3",
  "This Is My Fathers World.mp3",
].map((file) => WORSHIP_FOLDER + file);

// why: soon enough to still be on the tab; 4 s felt slow (the user, 2026-10-19).
export const MUSIC_NUDGE_AFTER_MS = 2000;

// --- Reminders (admin configuration) ---------------------------------------------------------------------

// The permission that lets someone set when the church is reminded to pray (schema.sql grants it to "admin").
export const MANAGE_PRAYER_REMINDERS = "prayer.reminders";

// One weekly nudge for the whole church (a row of `prayer_reminders`).
export type PrayerReminder = {
  id: string;
  weekday: number; // 0 = Sunday … 6 = Saturday
  send_at: string; // "HH:MM:SS", church time
};
