import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrayerReminder, PrayerTranslation } from "./types";

// Reads shared by both sides: the page on the server (server/queries.ts) and the screen refreshing itself in the
// browser (api.ts). The caller's client decides who is asking; RLS decides what they get.

// The church's prayer reminders, in the order a week runs. Empty for anyone without the "prayer.reminders"
// permission: members cannot read this table.
export async function getPrayerReminders(supabase: SupabaseClient): Promise<PrayerReminder[]> {
  const { data } = await supabase
    .from("prayer_reminders")
    .select("id, weekday, send_at")
    .is("group_id", null) // rows from when a reminder was for one group are left alone and never sent
    .order("weekday")
    .order("send_at");
  return data ?? [];
}

// The reviewers' reads, all from one function that checks "prayer.translations" (schema.sql 5d): empty, or null,
// for anyone without it.

// The requests whose translation waits for review, longest wait first.
export async function getTranslationsToReview(supabase: SupabaseClient): Promise<PrayerTranslation[]> {
  const { data } = await supabase
    .rpc("prayer_translations")
    .is("translation_reviewed_at", null)
    .order("created_at");
  return data ?? [];
}

// The approved ones, newest first: still open to correction when members say a translation reads badly.
export async function getPastTranslations(supabase: SupabaseClient): Promise<PrayerTranslation[]> {
  const { data } = await supabase
    .rpc("prayer_translations")
    .not("translation_reviewed_at", "is", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// One request, waiting or approved, for its translation's edit screen.
export async function getTranslation(supabase: SupabaseClient, requestId: string): Promise<PrayerTranslation | null> {
  const { data } = await supabase.rpc("prayer_translations").eq("id", requestId).maybeSingle();
  return data as PrayerTranslation | null;
}
