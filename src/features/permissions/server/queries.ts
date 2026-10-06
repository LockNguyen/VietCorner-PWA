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

// Everyone who holds `permission`, for telling them something (a push). This one reads the tables, because
// other people's tokens are not ours to read. `admin` must be the service-role client: the tables are
// closed to members.
export async function getUserIdsWithPermission(admin: SupabaseClient, permission: string): Promise<string[]> {
  const { data: roles } = await admin.from("role_permissions").select("role").eq("permission", permission);
  const { data: holders } = await admin
    .from("user_roles")
    .select("user_id")
    .in("role", (roles ?? []).map((row) => row.role));
  return [...new Set((holders ?? []).map((row) => row.user_id as string))];
}
