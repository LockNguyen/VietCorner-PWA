import type { SupabaseClient } from "@supabase/supabase-js";

// Auth reads for pages (Server Components). The page creates `supabase` and passes it in.

// Who is signed in, or null. Read from the login token, whose signature is checked here on the server with
// the project's public key: no trip to Supabase (decided 2026-10-09: most of this app is reading).
// The cost: a session ended elsewhere keeps READING until its token runs out, 15 minutes at most. Anything
// that writes still asks Supabase (`auth.getUser()` in every route), and the database checks each query.
export async function getCurrentUser(supabase: SupabaseClient): Promise<{ id: string; email: string } | null> {
  const claims = (await supabase.auth.getClaims()).data?.claims;
  return claims ? { id: claims.sub, email: claims.email ?? "" } : null;
}
