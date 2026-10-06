import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { createClient } from "@/lib/supabase/client";
import { rowOf, textOf } from "./draft";
import type { EventDraft } from "./types";

// Events API: every call the browser makes for this feature. Members only read, and that happens on the
// server (server/queries.ts), so everything here is an action of someone with the "events.manage" permission.
// - Saving and removing go straight to Supabase. RLS in schema.sql refuses anyone without the permission.
// - Cancelling goes through our API route, because it also notifies members (needs secrets).

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

// PATCH an event as removed. It leaves every list; the row stays in the database (soft delete).
export async function removeEvent(eventId: string): Promise<void> {
  const { error } = await createClient()
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
}

// POST a cancellation: one week when `occurrenceDate` (YYYY-MM-DD, church date) is given, otherwise the
// whole event. The server records it and tells the members who could see the event.
export async function cancelEvent(eventId: string, occurrenceDate?: string): Promise<void> {
  const response = await fetch("/api/events/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, occurrenceDate }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}
