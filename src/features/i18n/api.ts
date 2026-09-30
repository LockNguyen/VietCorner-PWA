import { createClient } from "@/lib/supabase/client";
import type { Language } from "./types";

// Every browser → backend call for this feature. Saving a language is a simple write with no side effects,
// so it goes straight to Supabase; RLS allows a user to write only their own row.

// Save the signed-in user's language. Upsert, because the row is created on the first save, not at sign-up.
export async function saveLanguage(language: Language) {
  const { error } = await createClient()
    .from("user_settings")
    .upsert({ language, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
