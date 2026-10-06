import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side reads for this feature. The page (or the root layout) creates the client and passes it in.

// What the signed-in user may do, e.g. ["events.manage", "groups.manage"]. Empty for a member, and for a
// signed-out visitor.
//
// This reads the login token, not a table: the permissions were written into it at sign-in (schema.sql).
// Use the answer to decide what to SHOW. It protects nothing: the database checks the same token again
// on every query, and that check is the one that counts.
export async function getMyPermissions(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.auth.getClaims();
  const permissions: unknown = data?.claims.permissions;
  return Array.isArray(permissions) ? permissions.filter((name) => typeof name === "string") : [];
}
