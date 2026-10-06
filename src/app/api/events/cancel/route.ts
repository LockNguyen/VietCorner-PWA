import { NextResponse } from "next/server";
import { cancelEvent } from "@/features/events/server/cancelEvent";
import { createClient } from "@/lib/supabase/server";

const CHURCH_DATE = /^\d{4}-\d{2}-\d{2}$/;

// POST { eventId, occurrenceDate? } → cancels that week, or the whole event, and notifies its members.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { eventId, occurrenceDate } = await request.json();
  const dateIsValid = occurrenceDate === undefined || (typeof occurrenceDate === "string" && CHURCH_DATE.test(occurrenceDate));
  if (typeof eventId !== "string" || !dateIsValid) {
    return NextResponse.json({ error: "eventId is required; occurrenceDate must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    await cancelEvent(supabase, { eventId, occurrenceDate });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // RLS: the caller does not hold the "events.manage" permission.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
