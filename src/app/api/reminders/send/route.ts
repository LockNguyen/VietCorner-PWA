import { NextResponse } from "next/server";
import { sendDueEventReminders } from "@/features/events/server/sendDueReminders";
import { sendDuePrayerReminders } from "@/features/prayer/server/sendDueReminders";

// POST → sends every reminder that is due right now. Called every 15 minutes by a cron job in Supabase
// (features/push/schema.sql, section 5), never by a browser.
//
// There is no signed-in user to verify, so the caller proves itself with a secret both sides hold. Without
// CRON_SECRET set, the route refuses everyone rather than being open.
// Calling it twice, or late, is safe: each feature works out what is due and sends each reminder once.
//
// The answer is for whoever reads the scheduler's log afterwards (Supabase keeps each response for a few
// hours): how many were sent and how long it took, or what went wrong. A run cut short is the one way a
// reminder gets lost, so the time taken is worth seeing.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const [events, prayer] = await Promise.all([sendDueEventReminders(), sendDuePrayerReminders()]);
    return NextResponse.json({ sent: { events, prayer }, tookMs: Date.now() - startedAt });
  } catch (error) {
    console.error("sending reminders failed", error);
    return NextResponse.json({ error: (error as Error).message, tookMs: Date.now() - startedAt }, { status: 500 });
  }
}
