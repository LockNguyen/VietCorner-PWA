import "server-only";
import { getLanguagesOf } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "@/features/i18n/types"; // I18N
import { getSubscribedUserIds } from "@/features/push/server/queries"; // PUSH
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { toInstant, wallTime } from "../churchTime";
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";

// What happened to the schedule: a date (or the whole event) was called off, or a called-off date is on again.
export type ScheduleChange = "canceled" | "backOn";

// Tells the members who could see an event that its schedule changed: the group's members for a group
// event, everyone with notifications on for a church-wide one. Each reads it in their own language.
// `occurrenceDate` (a church date) names the one week concerned; without it, the whole event is meant.
// Uses the admin client because RLS (correctly) hides other users' memberships and settings.
export async function notifyScheduleChange(eventId: string, change: ScheduleChange, occurrenceDate?: string) {
  const admin = createAdminClient();
  const [{ data: event }, { data: texts }] = await Promise.all([
    admin.from("events").select("group_id, starts_at, repeats_weekly").eq("id", eventId).single(),
    admin.from("event_texts").select("language, title").eq("event_id", eventId),
  ]);
  if (!event || !texts?.length) return; // nothing to call it by

  const userIds = event.group_id
    ? ((await admin.from("group_members").select("user_id").eq("group_id", event.group_id)).data ?? []).map(
        (member) => member.user_id as string,
      )
    : await getSubscribedUserIds(admin);
  const languageOf = await getLanguagesOf(admin, userIds);

  // The week concerned keeps the event's hour: that date at the event's wall-clock time.
  const hour = wallTime(new Date(event.starts_at)).slice(10); // "T19:00"
  const when = occurrenceDate ? toInstant(`${occurrenceDate}${hour}`) : new Date(event.starts_at);
  const wholeSeries = !occurrenceDate && event.repeats_weekly;

  // One send per language, each to the users who read that language.
  await Promise.all(
    LANGUAGES.map((language: Language) => {
      const title = texts.find((text) => text.language === language)?.title ?? texts[0].title;
      const what = translate(change === "canceled" ? STRINGS.canceled : STRINGS.backOn, language);
      const which = wholeSeries
        ? translate(STRINGS.untilFurtherNotice, language)
        : `${formatLongDate(when, language)}, ${formatTime(when, language)}`;

      // No topic on purpose: an announcement is always delivered and never replaces another one. Two dates
      // called off in the same minute are two notifications (the push README).
      return sendPush(
        userIds.filter((userId) => (languageOf.get(userId) ?? DEFAULT_LANGUAGE) === language),
        { title, body: `${what}: ${which}`, url: "/events" },
      );
    }),
  );
}
