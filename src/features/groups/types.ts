// Row shapes from schema.sql.

export type Group = {
  id: string;
  name: string;
  member_count: number | null; // how many people the group has, as an admin typed it; null = never typed
  thumbnail_path: string | null; // its picture's file in THUMBNAIL_BUCKET; null = none
};

// The public storage bucket the groups' pictures live in (schema.sql section 2d makes it).
export const THUMBNAIL_BUCKET = "group-thumbnails";

// why (the user, 2026-10-21: blurry next to the group's own photos): the picture fills a card the width of
// the phone and the top of the group page, so it gets a phone screen's width (3x a 400-point screen), at the
// best quality under 400 KB. The bucket refuses more than 500 KB (schema.sql 2f).
export const PICTURE_SIDE = 1600;
export const PICTURE_MAX_BYTES = 400_000;

// why: the database rejects anything longer (schema.sql); the inputs stop the typing at the same number.
// Long enough for "Vietnamese Young Adults Bible Study", short enough to fit one line of a phone.
export const MAX_GROUP_NAME_LENGTH = 60;

// The permission that lets someone create, rename and remove groups, and put people into them
// (schema.sql grants it to the "admin" role).
export const MANAGE_GROUPS = "groups.manage";

// A group plus where the signed-in user stands with it (built in server/queries.ts).
// `pending` = they asked to join and a manager has not decided yet. A pending group opens nothing.
export type GroupWithMembership = Group & { joined: boolean; pending: boolean };

// One request to join, as a manager sees it (a row of `group_join_requests`).
export type JoinRequest = {
  group_id: string;
  user_id: string;
  user_email: string; // the address the account signed in with: a name is whatever its owner typed
  requested_at: string;
};

// One row of `group_people()` (schema.sql): someone who may use the app, as a group manager sees them.
export type Person = {
  user_id: string;
  name: string;
  email: string; // the address the account signed in with: a name is whatever its owner typed
  group_ids: string[]; // the active groups they are in; empty = "has no group"
};
