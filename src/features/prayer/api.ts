import { createClient } from "@/lib/supabase/client";
import { FEED_COLUMNS, PAGE_SIZE, type NewPrayerRequest, type PrayerRequest } from "./types";

// Prayer API: every call the browser makes for this feature.
// - Reads and the author's own writes go straight to Supabase. The grants, policies and view in schema.sql
//   decide what is allowed.
// - Praying goes through our API route, because it also notifies the author (needs secrets).

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

// PATCH the words of my own request. RLS ignores the call for anyone else's.
export async function editRequest(requestId: string, body: string): Promise<void> {
  const { error } = await createClient().from("prayer_requests").update({ body }).eq("id", requestId);
  if (error) throw new Error(error.message);
}

// PATCH my own request as answered, which takes it out of everyone's list. RLS ignores the call for anyone else's.
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

// Postgres's code for "this would break a unique rule": here, the same group, day and time twice (schema.sql).
const ALREADY_EXISTS = "23505";

// POST a weekly reminder for a group ("Wednesdays at 19:00", church time). Needs "prayer.reminders".
// Answers "exists" when that group already has a reminder at that day and time: nothing was added, and the
// screen can say exactly that instead of "something went wrong". Any other refusal throws.
export async function addReminder(groupId: string, weekday: number, sendAt: string): Promise<"added" | "exists"> {
  const { error } = await createClient()
    .from("prayer_reminders")
    .insert({ group_id: groupId, weekday, send_at: sendAt });
  if (error?.code === ALREADY_EXISTS) return "exists";
  if (error) throw new Error(error.message);
  return "added";
}

// DELETE a reminder. Needs "prayer.reminders".
export async function removeReminder(reminderId: string): Promise<void> {
  const { error } = await createClient().from("prayer_reminders").delete().eq("id", reminderId);
  if (error) throw new Error(error.message);
}

// POST one prayer for someone else's request. The server counts it and tells the author.
export async function prayFor(requestId: string): Promise<void> {
  const response = await fetch("/api/prayer/pray", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}
