import type { SupabaseClient } from "@supabase/supabase-js";
import { FEED_COLUMNS, PAGE_SIZE, type PrayerRequest } from "../types";

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

// One of my own requests, for its edit screen; null when it is not mine or no longer listed.
export async function getMyRequest(supabase: SupabaseClient, requestId: string): Promise<PrayerRequest | null> {
  const { data } = await supabase
    .from("prayer_feed")
    .select(FEED_COLUMNS)
    .eq("id", requestId)
    .eq("is_mine", true)
    .maybeSingle();
  return data as PrayerRequest | null;
}

// The reminders' and the review list's reads are shared with the browser's refresh (api.ts): reads.ts.
export { getPrayerReminders, getTranslationsToReview } from "../reads";
