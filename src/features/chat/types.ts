// Row shapes from schema.sql.

export type Message = {
  id: number;
  group_id: string;
  sender_id: string;
  sender_email: string; // kept by the database as a record; people are shown by name (`profiles`)
  body: string;
  created_at: string;
};
