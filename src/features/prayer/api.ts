import { createClient } from "@/lib/supabase/client";
import { getPrayerReminders as readPrayerReminders, getTranslationsToReview as readTranslationsToReview } from "./reads";
import {
  FEED_COLUMNS,
  PAGE_SIZE,
  type NewPrayerRequest,
  type PrayerReminder,
  type PrayerRequest,
  type TranslationToReview,
} from "./types";

// Prayer API: every call the browser makes for this feature.
// - Reads and the author's own simple writes go straight to Supabase. The grants, policies and view in schema.sql
//   decide what is allowed. So does reviewing a translation: its function checks the permission.
// - Posting, editing and praying go through our API routes, because they also translate the words or notify
//   someone (needs secrets).

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

// POST a request to the whole church. The server posts it as me, then has it translated for review.
export async function createRequest(request: NewPrayerRequest): Promise<void> {
  await send("/api/prayer/post", { body: request.body });
}

// POST new words for my own request. The server changes them (RLS ignores anyone else's), then has them
// translated again for review.
export async function editRequest(requestId: string, body: string): Promise<void> {
  await send("/api/prayer/edit", { requestId, body });
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

// Postgres's code for "this would break a unique rule": here, the same day and time twice (schema.sql).
const ALREADY_EXISTS = "23505";

// POST a weekly reminder for the whole church ("Wednesdays at 19:00", church time). Needs "prayer.reminders".
// Answers "exists" when there already is a reminder at that day and time: nothing was added, and the
// screen can say exactly that instead of "something went wrong". Any other refusal throws.
export async function addReminder(weekday: number, sendAt: string): Promise<"added" | "exists"> {
  const { error } = await createClient()
    .from("prayer_reminders")
    .insert({ weekday, send_at: sendAt });
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
  await send("/api/prayer/pray", { requestId });
}

// Approve a request's translation as shown, or as the reviewer corrected it. Needs "prayer.translations"; the
// function checks it. Throws when the request was edited or removed meanwhile: nothing was approved.
export async function reviewTranslation(request: TranslationToReview, translation: string): Promise<void> {
  const { data, error } = await createClient().rpc("review_prayer_translation", {
    request_id: request.id,
    original: request.body, // the words the reviewer read, so an edit made meanwhile is not approved unread
    translation,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The request changed or was removed, so nothing was approved.");
}

// GET the review list again, as the admin page first read it, for the section to refresh itself on arrival.
export function getTranslationsToReview(): Promise<TranslationToReview[]> {
  return readTranslationsToReview(createClient());
}

// POST to one of our prayer routes; a refusal throws with the server's reason.
async function send(path: string, payload: object): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}

// GET the church's prayer reminders again, as the page first read them, for the screen to refresh itself on
// arrival (`useFresh`).
export function getPrayerReminders(): Promise<PrayerReminder[]> {
  return readPrayerReminders(createClient());
}
