// Row shapes from schema.sql.

export type Group = {
  id: string;
  name: string;
};

// A group plus whether the signed-in user is a member (built in server/queries.ts).
export type GroupWithMembership = Group & { joined: boolean };
