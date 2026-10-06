import { NextResponse } from "next/server";
import { sendDueEventReminders } from "@/features/events/server/sendDueReminders";
import { sendDuePrayerReminders } from "@/features/prayer/server/sendDueReminders";

// POST → sends every reminder that is due right now. Called every 15 minutes by a cron job in Supabase
// (features/push/schema.sql, section 5), never by a browser.
//
// There is no signed-in user to verify, so the caller proves itself with a secret both sides hold. Without
// CRON_SECRET set, the route refuses everyone rather than being open.
// Calling it twice, or late, is safe: each feature works out what is due and sends each reminder once.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const [events, prayer] = await Promise.all([sendDueEventReminders(), sendDuePrayerReminders()]);
  return NextResponse.json({ sent: { events, prayer } });
}
