// Row shapes from schema.sql.

export type Message = {
  id: number;
  group_id: string;
  sender_id: string;
  sender_email: string;
  body: string;
  created_at: string;
};
