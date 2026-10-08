import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { sendPushOnce } from "@/features/push/server/sendPushOnce"; // PUSH
import { isoDate } from "@/lib/churchTime";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDue } from "../reminders";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";

// Sends every group's prayer reminder that is due right now, once. Called by the scheduler (the reminders
// route); safe to call as often as it likes, because each send is claimed by key first (sendPushOnce).
// It reads no prayer request: the reminder only says it is time to pray. Answers how many it sent.
// Uses the admin client: nobody is signed in when the scheduler calls.
export async function sendDuePrayerReminders(now = new Date()): Promise<number> {
  const admin = createAdminClient();
  const { data: reminders } = await admin.from("prayer_reminders").select("id, group_id, weekday, send_at");
  const due = ((reminders ?? []) as PrayerReminder[]).filter((reminder) => isDue(reminder, now));
  if (due.length === 0) return 0;

  // Side by side, not one after another: the scheduler's call has a few seconds, and each reminder is
  // several trips to the database. They are independent, so nothing is lost by not waiting in line.
  const sentPerReminder = await Promise.all(due.map((reminder) => sendOne(admin, reminder, isoDate(now))));
  return sentPerReminder.reduce((total, sent) => total + sent, 0);
}

// One group's reminder, to its members, once per language. Answers how many notifications it sent (0 to 2).
async function sendOne(admin: ReturnType<typeof createAdminClient>, reminder: PrayerReminder, churchDate: string) {
  const [{ data: group }, { data: members }] = await Promise.all([
    admin.from("groups").select("name").eq("id", reminder.group_id).is("deleted_at", null).maybeSingle(),
    admin.from("group_members").select("user_id").eq("group_id", reminder.group_id),
  ]);
  if (!group) return 0; // the group was removed

  const readers = await splitByLanguage(admin, (members ?? []).map((member) => member.user_id as string));
  const wasSent = await Promise.all(
    LANGUAGES.map((language) =>
      sendPushOnce(`prayer-reminder:${reminder.id}:${churchDate}:${language}`, readers[language], {
        title: group.name,
        body: translate(STRINGS.timeToPray, language),
        url: "/prayer",
      }),
    ),
  );
  return wasSent.filter(Boolean).length;
}
