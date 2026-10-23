// Whether a value is a database id (a UUID, as Postgres writes them). Routes check an id with it before asking the
// database, so a malformed one is answered 400 ("your request is wrong") instead of the database's own error as a
// 500. Pure, so it is tested without a server.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
