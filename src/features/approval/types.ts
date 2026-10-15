// The permission that lets someone approve new accounts (schema.sql grants it to "admin").
export const MANAGE_ACCOUNTS = "accounts.manage";

// One row of `waiting_accounts()` (schema.sql): someone who signed up, gave their name, and waits to be let in.
export type WaitingAccount = {
  user_id: string;
  name: string;
  email: string;
};
