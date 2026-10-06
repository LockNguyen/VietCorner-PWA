import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../types";

// Server-side reads for this feature. The page (or the root layout) creates the client and passes it in.

// The signed-in user's language, or null when they are signed out or have never chosen one.
// Null is not "English": the caller decides the fallback, which for a signed-out visitor is the choice
// stored on their device.
export async function getLanguage(supabase: SupabaseClient): Promise<Language | null> {
  const { data } = await supabase.from("user_settings").select("language").maybeSingle();
  return isLanguage(data?.language) ? data.language : null;
}

// Other users' languages, for text the server writes to them (a push notification), in one read.
// A user who never chose is absent from the map: the caller decides the fallback.
// `admin` must be the service-role client: RLS shows a user only their own row.
export async function getLanguagesOf(admin: SupabaseClient, userIds: string[]): Promise<Map<string, Language>> {
  const { data } = await admin.from("user_settings").select("user_id, language").in("user_id", userIds);
  return new Map((data ?? []).filter((row) => isLanguage(row.language)).map((row) => [row.user_id, row.language]));
}

// The same users, sorted by the language to write to them in: what a sender needs to push one text per
// language. Someone who never chose gets the default.
export async function splitByLanguage(admin: SupabaseClient, userIds: string[]): Promise<Record<Language, string[]>> {
  const chosen = await getLanguagesOf(admin, userIds);
  const split: Record<Language, string[]> = { en: [], vi: [] };
  for (const userId of userIds) split[chosen.get(userId) ?? DEFAULT_LANGUAGE].push(userId);
  return split;
}
