import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { shrinkToThumbnail } from "@/lib/shrinkImage";
import { createClient } from "@/lib/supabase/client";
import { rowOf, textOf } from "./draft";
import { scheduleWindow } from "./occurrences";
import { THUMBNAIL_BUCKET, type EventDraft, type ScheduledEvent } from "./types";

// Events API: every call the browser makes for this feature. Members only read: `getSchedule`. Everything
// else here is an action of someone with the "events.manage" permission.
// - Saving, choosing reminders and the picture go straight to Supabase. RLS in schema.sql refuses anyone without the permission.
// - Cancelling and undoing go through our API route, because they also notify members (needs secrets).

// GET the schedule again, as the page first read it (server/queries.ts): one call to `upcoming_events()`.
// For the list to refresh itself on arrival, without reloading the page.
export async function getSchedule(): Promise<ScheduledEvent[]> {
  const { data, error } = await createClient().rpc("upcoming_events", scheduleWindow(new Date()));
  if (error) throw new Error(error.message);
  return data;
}

// POST a new event, or PATCH an existing one when `eventId` is given, with its text in each language.
//
// This is several requests, not one transaction. If a later one fails, the event exists with older or
// missing text; the error is shown, the form stays open, and saving again finishes the job.
export async function saveEvent(draft: EventDraft, eventId?: string): Promise<void> {
  const supabase = createClient();
  let id = eventId;

  if (id) {
    const { error } = await supabase.from("events").update(rowOf(draft)).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("events").insert(rowOf(draft)).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id;
  }

  for (const language of LANGUAGES) {
    const text = textOf(draft, language);
    // A language whose title was cleared loses its row, so its readers fall back to the other language.
    const { error } = text
      ? await supabase.from("event_texts").upsert({ event_id: id, language, ...text })
      : await supabase.from("event_texts").delete().eq("event_id", id).eq("language", language);
    if (error) throw new Error(error.message);
  }
}

// PUT or DELETE one reminder choice of an event ("30 minutes before"). Straight to Supabase: it only stores
// the choice; the scheduler sends.
export async function setReminder(eventId: string, minutesBefore: number, on: boolean): Promise<void> {
  const reminders = createClient().from("event_reminders");
  const { error } = on
    ? await reminders.upsert(
        { event_id: eventId, minutes_before: minutesBefore },
        // Already on = nothing to do. Without `ignoreDuplicates` this is an insert-or-UPDATE, and managers
        // have no update grant on this table, so Postgres refused every switch (found on a phone, 2026-10-09).
        { onConflict: "event_id,minutes_before", ignoreDuplicates: true },
      )
    : await reminders.delete().eq("event_id", eventId).eq("minutes_before", minutesBefore);
  if (error) throw new Error(error.message);
}

// PUT an event's picture: shrunk on this device, stored under a new name, then recorded on the event.
// `replaces` is the picture it had, whose file is erased last. A new name each time, because a phone keeps
// a public file by its address: the same address would go on showing the old picture.
export async function setThumbnail(eventId: string, file: Blob, replaces: string | null): Promise<void> {
  const supabase = createClient();
  const bucket = supabase.storage.from(THUMBNAIL_BUCKET);
  const path = `${eventId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await bucket.upload(path, await shrinkToThumbnail(file), { contentType: "image/jpeg" });
  if (uploadError) throw new Error(uploadError.message);

  // RLS does not refuse an update it forbids, it matches no row: the row is asked back to tell.
  const { data, error } = await supabase.from("events").update({ thumbnail_path: path }).eq("id", eventId).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("No such event, or not allowed");

  if (replaces) await bucket.remove([replaces]); // best-effort: a file left behind is on no screen
}

// DELETE an event's picture: taken off the event, then its file erased.
export async function removeThumbnail(eventId: string, path: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").update({ thumbnail_path: null }).eq("id", eventId).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("No such event, or not allowed");

  await supabase.storage.from(THUMBNAIL_BUCKET).remove([path]); // best-effort, as above
}

// POST a cancellation: one week when `occurrenceDate` (YYYY-MM-DD, church date) is given, otherwise the
// whole event, for good. The server records it and tells the members who could see the event.
export function cancelEvent(eventId: string, occurrenceDate?: string): Promise<void> {
  return changeSchedule("POST", eventId, occurrenceDate);
}

// DELETE a cancellation: that week is on again, and members are told.
export function restoreDate(eventId: string, occurrenceDate: string): Promise<void> {
  return changeSchedule("DELETE", eventId, occurrenceDate);
}

async function changeSchedule(method: "POST" | "DELETE", eventId: string, occurrenceDate?: string) {
  const response = await fetch("/api/events/cancel", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, occurrenceDate }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}
