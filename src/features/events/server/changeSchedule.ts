import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyScheduleChange, type ScheduleChange } from "./notifyScheduleChange";

// The three changes a manager makes to an event's schedule. Each records the change as the caller, then
// tells the members who could see the event.
//
// Permission check: `supabase` is the caller's own client, so the policies in schema.sql decide. But writes
// fail differently for someone without the permission. An insert is refused with an error. An update or a
// delete is not an error at all: RLS just matches no row. So those ask for the row back, and "nothing came
// back" is treated as refused. Without that, anyone could make these functions notify the whole church.

// Calls off one week (`occurrenceDate`, a church date). It can be undone with `restoreDate`.
export async function cancelDate(supabase: SupabaseClient, eventId: string, occurrenceDate: string) {
  const { error } = await supabase
    .from("event_cancellations")
    .insert({ event_id: eventId, occurrence_date: occurrenceDate });
  if (error) throw new Error(error.message);

  await notifyBestEffort(eventId, "canceled", occurrenceDate);
}

// Puts a called-off week back on.
export async function restoreDate(supabase: SupabaseClient, eventId: string, occurrenceDate: string) {
  const { data, error } = await supabase
    .from("event_cancellations")
    .delete()
    .eq("event_id", eventId)
    .eq("occurrence_date", occurrenceDate)
    .select("event_id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("Nothing to restore, or not allowed");

  await notifyBestEffort(eventId, "backOn", occurrenceDate);
}

// Calls the whole event off, for good. Members see it struck through for a week (server/queries.ts), then
// not at all; the app has no way to bring it back, though the row is kept.
export async function cancelForGood(supabase: SupabaseClient, eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .update({ canceled_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("canceled_at", null) // a second tap must not move the date the week is counted from, or notify again
    .select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("Already cancelled, or not allowed");

  await notifyBestEffort(eventId, "canceled");
}

// The change is already saved, so a push failure must not report "it failed", or the admin does it twice.
async function notifyBestEffort(eventId: string, change: ScheduleChange, occurrenceDate?: string) {
  try {
    await notifyScheduleChange(eventId, change, occurrenceDate);
  } catch (error) {
    console.error("notifyScheduleChange failed", error);
  }
}
