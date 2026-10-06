import "server-only";
import { getLanguageOf } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { DEFAULT_LANGUAGE } from "@/features/i18n/types"; // I18N
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { prayedForYou, STRINGS } from "../strings";

// Tells the author of a request how many times it has been prayed for, in their own language.
// It never says who prayed: that is not stored anywhere.
// Uses the admin client because members cannot read who wrote a request, or its count (schema.sql).
export async function notifyAuthor(requestId: string) {
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("prayer_requests")
    .select("author_id, prayer_count")
    .eq("id", requestId)
    .single();
  if (!request) return; // deleted between the prayer and this read

  const language = (await getLanguageOf(admin, request.author_id)) ?? DEFAULT_LANGUAGE;
  await sendPush([request.author_id], {
    title: translate(STRINGS.notificationTitle, language),
    body: translate(prayedForYou(request.prayer_count), language),
    url: "/prayer",
    topic: "prayer", // all of an author's requests share one pause: several prayers in a minute, one notification
  });
}
