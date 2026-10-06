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

// Tells the members who could see an event that it is off: the group's members for a group event,
// everyone with notifications on for a church-wide one. Each reads it in their own language.
// Uses the admin client because RLS (correctly) hides other users' memberships and settings.
export async function notifyCancellation(eventId: string, occurrenceDate?: string) {
  const admin = createAdminClient();
  const [{ data: event }, { data: texts }] = await Promise.all([
    admin.from("events").select("group_id, starts_at, repeats_weekly").eq("id", eventId).single(),
    admin.from("event_texts").select("language, title").eq("event_id", eventId),
  ]);
  if (!event || !texts?.length) return; // removed meanwhile, or nothing to call it by

  const userIds = event.group_id
    ? ((await admin.from("group_members").select("user_id").eq("group_id", event.group_id)).data ?? []).map(
        (member) => member.user_id as string,
      )
    : await getSubscribedUserIds(admin);
  const languageOf = await getLanguagesOf(admin, userIds);

  // The week that is off keeps the event's hour: the cancelled date at the event's wall-clock time.
  const hour = wallTime(new Date(event.starts_at)).slice(10); // "T19:00"
  const when = occurrenceDate ? toInstant(`${occurrenceDate}${hour}`) : new Date(event.starts_at);
  const wholeSeries = !occurrenceDate && event.repeats_weekly;

  // One send per language, each to the users who read that language.
  await Promise.all(
    LANGUAGES.map((language: Language) => {
      const title = texts.find((text) => text.language === language)?.title ?? texts[0].title;
      const whatIsOff = wholeSeries
        ? translate(STRINGS.canceledUntilFurtherNotice, language)
        : `${formatLongDate(when, language)}, ${formatTime(when, language)}`;

      return sendPush(
        userIds.filter((userId) => (languageOf.get(userId) ?? DEFAULT_LANGUAGE) === language),
        {
          title,
          body: `${translate(STRINGS.canceled, language)}: ${whatIsOff}`,
          url: "/events",
          topic: `event:${eventId}`, // its own topic: the one-minute pause on chat never swallows a cancellation
        },
      );
    }),
  );
}
