import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyCancellation } from "./notifyCancellation";

// Calls off one week of an event (`occurrenceDate`, a church date) or the whole event, then tells members.
//
// Permission check: `supabase` is the caller's own client, so the policies in schema.sql decide. But the two
// writes fail differently for someone without the permission. An insert is refused with an error. An update
// is not an error at all: RLS just matches no row. So the update asks for the row back, and "nothing came
// back" is treated as refused. Without that, anyone could make this function notify the whole church.
export async function cancelEvent(
  supabase: SupabaseClient,
  input: { eventId: string; occurrenceDate?: string },
): Promise<void> {
  if (input.occurrenceDate) {
    const { error } = await supabase
      .from("event_cancellations")
      .insert({ event_id: input.eventId, occurrence_date: input.occurrenceDate });
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("events")
      .update({ canceled_at: new Date().toISOString() })
      .eq("id", input.eventId)
      .select("id");
    if (error) throw new Error(error.message);
    if (data.length === 0) throw new Error("Not allowed to cancel this event");
  }

  // The notification is best-effort. The cancellation is already saved, so a push failure must not report
  // "cancelling failed", or the admin cancels twice.
  try {
    await notifyCancellation(input.eventId, input.occurrenceDate);
  } catch (error) {
    console.error("notifyCancellation failed", error);
  }
}
