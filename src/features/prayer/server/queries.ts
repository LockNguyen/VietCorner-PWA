import type { SupabaseClient } from "@supabase/supabase-js";
import { FEED_COLUMNS, PAGE_SIZE, type PrayerReminder, type PrayerRequest } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// The newest page of the church's requests. The `prayer_feed` view decides what
// comes back and hides the author of an anonymous request; later pages are fetched by the browser (api.ts).
export async function getLatestRequests(supabase: SupabaseClient): Promise<PrayerRequest[]> {
  const { data, error } = await supabase
    .from("prayer_feed")
    .select(FEED_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) return []; // also the answer before schema.sql has been run

  return data as PrayerRequest[];
}

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
