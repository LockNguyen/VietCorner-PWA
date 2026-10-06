import type { SupabaseClient } from "@supabase/supabase-js";
import { FEED_COLUMNS, PAGE_SIZE, type PrayerReminder, type PrayerRequest } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// The newest page of requests from every group this member joined. The `prayer_feed` view decides what
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

// Every group's prayer reminders, in the order a week runs. Empty for anyone without the "prayer.reminders"
// permission: members cannot read this table.
export async function getPrayerReminders(supabase: SupabaseClient): Promise<PrayerReminder[]> {
  const { data } = await supabase
    .from("prayer_reminders")
    .select("id, group_id, weekday, send_at")
    .order("weekday")
    .order("send_at");
  return data ?? [];
}
