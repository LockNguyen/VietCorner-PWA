import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { getUserIdsWithPermission } from "@/features/permissions/server/queries"; // PERMISSIONS
import { USE_THE_APP } from "@/features/permissions/types"; // PERMISSIONS
import { sendPushOnce } from "@/features/push/server/sendPushOnce"; // PUSH
import { isoDate } from "@/lib/churchTime";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDue } from "../reminders";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";

// Sends every prayer reminder that is due right now, once, to the whole church. Called by the scheduler
// (the reminders route); safe to call as often as it likes, because each send is claimed by key first
// (sendPushOnce). It reads no prayer request: the reminder only says it is time to pray. Answers how many
// notifications it sent. Uses the admin client: nobody is signed in when the scheduler calls.
export async function sendDuePrayerReminders(now = new Date()): Promise<number> {
  const admin = createAdminClient();
  // Rows from when a reminder was for one group still carry that group: they are left alone and never sent.
  const { data: reminders } = await admin.from("prayer_reminders").select("id, weekday, send_at").is("group_id", null);
  const due = ((reminders ?? []) as PrayerReminder[]).filter((reminder) => isDue(reminder, now));
  if (due.length === 0) return 0; // the common case: nothing is read about who would be told

  // Every approved member, not everyone with a device: someone still waiting to be let in is not told.
  const readers = await splitByLanguage(admin, await getUserIdsWithPermission(admin, USE_THE_APP));
  const churchDate = isoDate(now);
  const wasSent = await Promise.all(
    due.flatMap((reminder) =>
      LANGUAGES.map((language) =>
        sendPushOnce(`prayer-reminder:${reminder.id}:${churchDate}:${language}`, readers[language], {
          title: translate(STRINGS.notificationTitle, language),
          body: translate(STRINGS.timeToPray, language),
          url: "/prayer",
        }),
      ),
    ),
  );
  return wasSent.filter(Boolean).length;
}
