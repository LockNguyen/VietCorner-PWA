// One row of `group_directory()` (schema.sql): a group as the Groups page shows it.
export type DirectoryGroup = {
  id: string;
  name: string; // in Vietnamese
  name_en: string | null; // in English, typed by an admin; null = not yet (Vietnamese shows instead)
  member_count: number | null; // typed by an admin (the groups feature); null = never typed
  thumbnail_path: string | null; // the group's picture, set by an admin (the groups feature); null = none
  is_member: boolean; // the signed-in person is in it, so they may add pictures to it
  meets_at: string | null; // free text typed before the weekday picker: shown until a day and time are chosen
  meets_weekday: number | null; // 0 = Sunday … 6 = Saturday
  meets_time: string | null; // "19:30:00", church time
  location: string | null; // in Vietnamese
  location_en: string | null; // in English; null = not yet
  notes: string | null; // "Read Matthew 3 before next week"
  member_initials: string[]; // of the people in it who have the app, for the circles on its card
};

// Everything the group editor saves with its one Save: the name and size (on `groups`, the groups feature's
// table) and when it meets, where, and notes (`group_info`). "" = not said.
export type GroupInfoDraft = {
  name: string;
  nameEn: string;
  memberCount: string; // digits only
  meetsWeekday: string;
  meetsTime: string;
  location: string;
  locationEn: string;
  notes: string;
};

// The public storage bucket the groups' row pictures live in. It belongs to the groups feature (its
// schema.sql makes it); named here so this feature imports nothing of it.
export const GROUP_THUMBNAIL_BUCKET = "group-thumbnails";

// The permission that lets someone change a group's details and number of members, and remove its pictures. It belongs to
// the groups feature (its schema.sql grants it to "admin"); named here so this feature imports nothing of it.
export const MANAGE_GROUPS = "groups.manage";

// why: the database rejects longer notes (schema.sql); the box stops the typing at the same number. The
// bilingual name and place boxes do not stop, as on an event: a name over 60 or a place over 150 is refused
// by the database and the Save banner says so.
export const MAX_NOTES_LENGTH = 500;
// why: no group of this church has ten thousand people; four digits also keep the number on one line.
export const MAX_MEMBER_COUNT_DIGITS = 4;
// why: a card has room for one line of circles; past that the rest is said as "+N".
export const MAX_CIRCLES = 8;
// --- Pictures ------------------------------------------------------------------------------------------

// One of a group's pictures, ready to draw: a row of `group_photos` plus two addresses that work for an hour.
export type Photo = {
  id: string;
  taken_on: string | null; // YYYY-MM-DD, if whoever added it said
  caption: string | null;
  created_at: string; // when it was added: what the strip is ordered and paged by
  smallUrl: string; // for the strip
  fullUrl: string; // for the large view
};

// What the "add a picture" form sends. An empty date or caption is saved as "not said".
export type NewPhoto = { file: Blob; takenOn: string; caption: string };

// The storage bucket the pictures live in (schema.sql makes it, private).
export const PHOTO_BUCKET = "group-photos";

// Where a picture's two files are kept. The group's id is the folder, which is what the storage rules read
// to decide who may add to it.
export const photoPaths = (groupId: string, photoId: string) => ({
  small: `${groupId}/${photoId}-small.jpg`,
  full: `${groupId}/${photoId}.jpg`,
});

// why: three show at once and the fourth shows its edge, so six is two swipes' worth: enough to feel there
// is more, small enough to arrive at once on a slow connection. More load at the end of the strip.
export const PHOTO_PAGE_SIZE = 6;

// why: the strip draws a picture about 130 points wide; 400 pixels keeps it sharp on a 3x phone screen.
export const SMALL_SIDE = 400;
// why (the user, 2026-10-17: 300 KB looked ugly): as many pixels as a large phone screen has, at the best
// quality that stays under 1 MB, just inside the bucket's own limit (schema.sql). About 1,000 pictures fill
// the free gigabyte.
export const FULL_SIDE = 2560;
export const FULL_MAX_BYTES = 1_000_000;

// why: a picture's address is signed for an hour: long enough to look through a group's pictures, short
// enough that an address copied out of the app soon stops working.
export const PHOTO_URL_SECONDS = 60 * 60;

// why: the database rejects anything longer (schema.sql); a caption is a line, not a story.
export const MAX_CAPTION_LENGTH = 200;
