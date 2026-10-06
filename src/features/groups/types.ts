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

// A group plus whether the signed-in user is a member (built in server/queries.ts).
export type GroupWithMembership = Group & { joined: boolean };
