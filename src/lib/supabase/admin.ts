import "server-only";
import { createClient } from "@supabase/supabase-js";

// Admin client: bypasses RLS. Server-only.
// Use it only when the server must read other users' rows (e.g. their push subscriptions).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
