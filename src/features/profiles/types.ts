// The signed-in person's own row of `profiles` (schema.sql).
export type Profile = {
  name: string;
  named: boolean; // false = `name` is still the stand-in made from their email, and they are yet to be asked
  avatarPath: string | null; // their picture in AVATAR_BUCKET; null = the default figure
};

// Other people's names by user id: what a screen that shows people is handed. Someone may be missing:
// a member only reads the names of people they share a group with, and of nobody who has left.
export type Names = Partial<Record<string, string>>;

// What setting a name did: saved at once, or kept for a group manager to approve (schema.sql, section 5).
export type NameOutcome = "saved" | "requested";

// A name someone asked for, as a manager sees it (a row of `name_requests`).
export type NameRequest = {
  user_id: string;
  user_email: string; // the address the account signed in with: a name is whatever its owner typed
  name: string;
  requested_at: string;
};

// The public storage bucket people's pictures live in (schema.sql section 6), each in a folder named after its owner.
export const AVATAR_BUCKET = "avatars";

// why: the largest circle a picture is shown in is 96 points; 400 pixels keeps it sharp on a 3x screen at
// about 30 KB, well under the bucket's 200 KB limit.
export const AVATAR_SIDE = 400;

// why: the database rejects anything longer (schema.sql); the field stops the typing at the same number.
export const MAX_NAME_LENGTH = 60;
