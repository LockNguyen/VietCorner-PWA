import type { SupabaseClient } from "@supabase/supabase-js";
import { isLanguage, type Language } from "../types";

// Server-side reads for this feature. The page (or the root layout) creates the client and passes it in.

// The signed-in user's language, or null when they are signed out or have never chosen one.
// Null is not "English": the caller decides the fallback, which for a signed-out visitor is the choice
// stored on their device.
export async function getLanguage(supabase: SupabaseClient): Promise<Language | null> {
  const { data } = await supabase.from("user_settings").select("language").maybeSingle();
  return isLanguage(data?.language) ? data.language : null;
}
