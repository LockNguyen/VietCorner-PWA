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

  let sent = 0;
  for (const reminder of due) {
    const [{ data: group }, { data: members }] = await Promise.all([
      admin.from("groups").select("name").eq("id", reminder.group_id).is("deleted_at", null).maybeSingle(),
      admin.from("group_members").select("user_id").eq("group_id", reminder.group_id),
    ]);
    if (!group) continue; // the group was removed

    const readers = await splitByLanguage(admin, (members ?? []).map((member) => member.user_id as string));
    for (const language of LANGUAGES) {
      const wasSent = await sendPushOnce(`prayer-reminder:${reminder.id}:${isoDate(now)}:${language}`, readers[language], {
        title: group.name,
        body: translate(STRINGS.timeToPray, language),
        url: "/prayer",
      });
      if (wasSent) sent++;
    }
  }
  return sent;
}
