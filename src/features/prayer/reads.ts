import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrayerReminder } from "./types";

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
