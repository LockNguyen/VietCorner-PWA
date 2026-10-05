import { createClient } from "@/lib/supabase/client";
import { FEED_COLUMNS, PAGE_SIZE, type NewPrayerRequest, type PrayerRequest } from "./types";

// Prayer API: every call the browser makes for this feature. All of it goes straight to Supabase; the
// grants, policies, view and function in schema.sql decide what is allowed. Nothing here needs a secret
// or causes a side effect, so there is no route.

// GET one page of requests, newest first. Pass the `created_at` of the oldest one on screen to get the
// page after it; pass nothing for the newest page.
export async function getRequests(olderThan?: string): Promise<PrayerRequest[]> {
  let query = createClient()
    .from("prayer_feed")
    .select(FEED_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (olderThan) query = query.lt("created_at", olderThan);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as PrayerRequest[];
}

// POST a request to one of my groups. The author is taken from the login token by the database.
export async function createRequest(request: NewPrayerRequest): Promise<void> {
  const { error } = await createClient()
    .from("prayer_requests")
    .insert({ group_id: request.groupId, body: request.body, is_anonymous: request.isAnonymous });
  if (error) throw new Error(error.message);
}

// PATCH my own request as answered. RLS ignores the call for anyone else's.
export async function markAnswered(requestId: string): Promise<void> {
  const { error } = await createClient()
    .from("prayer_requests")
    .update({ answered_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}

// DELETE my own request, for good. RLS ignores the call for anyone else's.
export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await createClient().from("prayer_requests").delete().eq("id", requestId);
  if (error) throw new Error(error.message);
}

// POST one prayer for someone else's request. The database adds exactly one to its count.
export async function prayFor(requestId: string): Promise<void> {
  const { error } = await createClient().rpc("pray_for_request", { request_id: requestId });
  if (error) throw new Error(error.message);
}
