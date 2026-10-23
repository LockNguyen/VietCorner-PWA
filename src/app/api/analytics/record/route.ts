import { NextResponse } from "next/server";
import { recordEvents, validEvents } from "@/features/analytics/server/recordEvents";
import { createClient } from "@/lib/supabase/server";
import { SWITCHES } from "@/lib/switches";

// POST [events] → stores what the signed-in person's phone recorded (features/analytics). Sent with
// sendBeacon, which nobody waits on, so the answer only matters to whoever debugs it.
export async function POST(request: Request) {
  if (!SWITCHES.analytics) return NextResponse.json({ error: "Switched off" }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const events = validEvents(await request.json().catch(() => null));

  try {
    await recordEvents(supabase, events);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
