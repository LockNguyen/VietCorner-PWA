import { NextResponse } from "next/server";
import { cancelDate, cancelForGood, restoreDate } from "@/features/events/server/changeSchedule";
import { createClient } from "@/lib/supabase/server";

const CHURCH_DATE = /^\d{4}-\d{2}-\d{2}$/;

// POST   { eventId, occurrenceDate? } → cancels that week, or without a date the whole event for good.
// DELETE { eventId, occurrenceDate }  → puts a cancelled week back on.
// Both notify the members who could see the event.
export async function POST(request: Request) {
  return handle(request, { dateRequired: false }, (supabase, eventId, occurrenceDate) =>
    occurrenceDate ? cancelDate(supabase, eventId, occurrenceDate) : cancelForGood(supabase, eventId),
  );
}

export async function DELETE(request: Request) {
  return handle(request, { dateRequired: true }, (supabase, eventId, occurrenceDate) =>
    restoreDate(supabase, eventId, occurrenceDate as string),
  );
}

// The part both methods share: verify the user, validate the body, run the change, answer.
async function handle(
  request: Request,
  { dateRequired }: { dateRequired: boolean },
  change: (supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, occurrenceDate?: string) => Promise<void>,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { eventId, occurrenceDate } = await request.json();
  const dateIsValid =
    typeof occurrenceDate === "string" ? CHURCH_DATE.test(occurrenceDate) : occurrenceDate === undefined && !dateRequired;
  if (typeof eventId !== "string" || !dateIsValid) {
    return NextResponse.json({ error: "eventId is required; occurrenceDate must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    await change(supabase, eventId, occurrenceDate);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // RLS: the caller does not hold the "events.manage" permission, or there was nothing to change.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
