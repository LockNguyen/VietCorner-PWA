// Row shapes from schema.sql.

export type Group = {
  id: string;
  name: string;
};

// A group plus whether the signed-in user is a member (built in server/queries.ts).
export type GroupWithMembership = Group & { joined: boolean };

export type Message = {
  id: number;
  group_id: string;
  sender_id: string;
  sender_email: string;
  body: string;
  created_at: string;
};
