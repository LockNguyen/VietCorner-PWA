// Row shapes from schema.sql.

export type Group = {
  id: string;
  name: string;
};

// why: the database rejects anything longer (schema.sql); the inputs stop the typing at the same number.
// Long enough for "Vietnamese Young Adults Bible Study", short enough to fit one line of a phone.
export const MAX_GROUP_NAME_LENGTH = 60;

// The permission that lets someone create and rename groups (schema.sql grants it to the "admin" role).
export const MANAGE_GROUPS = "groups.manage";

// A group plus where the signed-in user stands with it (built in server/queries.ts).
// `pending` = they asked to join and a manager has not decided yet. A pending group opens nothing.
export type GroupWithMembership = Group & { joined: boolean; pending: boolean };

// One request to join, as a manager sees it (a row of `group_join_requests`).
export type JoinRequest = {
  group_id: string;
  user_id: string;
  user_email: string;
  requested_at: string;
};
