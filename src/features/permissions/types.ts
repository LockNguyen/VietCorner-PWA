// The permission every approved member holds (schema.sql gives it to the roles "member" and "admin").
// Without it an account can sign in and reads nothing: the `approval` feature is how a person gets it.
export const USE_THE_APP = "app.use";

// Whether these permissions include one that manages something, which is what earns the Admin tab.
// Every member holds "app.use", so "has any permission" would no longer tell an admin from a member.
export function managesSomething(permissions: string[]): boolean {
  return permissions.some((permission) => permission !== USE_THE_APP);
}
