import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { sendPushOnce } from "@/features/push/server/sendPushOnce"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { formatLongDate, formatTime } from "../formatting";
import { dueReminders } from "../reminders";
import { EVENT_COLUMNS, type EventRow } from "../types";
import { audienceOf } from "./audience";

// Sends every event reminder that is due right now, once. Called by the scheduler (the reminders route);
// safe to call as often as it likes, because each send is claimed by key first (sendPushOnce).
// Answers how many notifications this call sent.
// Uses the admin client: nobody is signed in when the scheduler calls, and reminders are closed to members.
export async function sendDueEventReminders(now = new Date()): Promise<number> {
  const admin = createAdminClient();
  const { data: reminders } = await admin.from("event_reminders").select("event_id, minutes_before");
  if (!reminders?.length) return 0;

  const ids = [...new Set(reminders.map((reminder) => reminder.event_id as string))];
  const [{ data: events }, { data: texts }, { data: cancellations }, { data: removedGroups }] = await Promise.all([
    admin.from("events").select(EVENT_COLUMNS).in("id", ids).is("deleted_at", null).is("canceled_at", null),
    admin.from("event_texts").select("event_id, language, title").in("event_id", ids),
    admin.from("event_cancellations").select("event_id, occurrence_date").in("event_id", ids),
    admin.from("groups").select("id").not("deleted_at", "is", null),
  ]);
  const removed = new Set((removedGroups ?? []).map((group) => group.id));

  // Side by side, not one after another: the scheduler's call has a few seconds, and each event with a
  // reminder due is several trips to the database. They are independent of each other.
  const sentPerEvent = await Promise.all(
    ((events ?? []) as EventRow[]).map(async (event) => {
      const titles = (texts ?? []).filter((text) => text.event_id === event.id);
      if (titles.length === 0 || (event.group_id && removed.has(event.group_id))) return 0;

      const due = dueReminders(
        event,
        reminders.filter((reminder) => reminder.event_id === event.id).map((reminder) => reminder.minutes_before),
        new Set((cancellations ?? []).filter((row) => row.event_id === event.id).map((row) => row.occurrence_date)),
        now,
      );
      if (due.length === 0) return 0; // the common case: nothing is read about who would be told

      const readers = await splitByLanguage(admin, await audienceOf(admin, event.group_id));
      const wasSent = await Promise.all(
        due.flatMap(({ startsAt, minutesBefore }) =>
          LANGUAGES.map((language) =>
            sendPushOnce(
              `event-reminder:${event.id}:${startsAt.toISOString()}:${minutesBefore}:${language}`,
              readers[language],
              {
                title: titles.find((text) => text.language === language)?.title ?? titles[0].title,
                body: `${formatLongDate(startsAt, language)}, ${formatTime(startsAt, language)}`,
                url: "/events",
              },
            ),
          ),
        ),
      );
      return wasSent.filter(Boolean).length;
    }),
  );
  return sentPerEvent.reduce((total, sent) => total + sent, 0);
}
