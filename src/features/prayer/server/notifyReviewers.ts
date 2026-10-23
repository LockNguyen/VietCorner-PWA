import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { getUserIdsWithPermission } from "@/features/permissions/server/queries"; // PERMISSIONS
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { STRINGS } from "../strings";
import { REVIEW_TRANSLATIONS } from "../types";

// Tells everyone who reviews translations that a request waits on the Admin tab, each in their own language.
// One topic: five requests in a minute are one notification.
// Uses the admin client because RLS (correctly) hides other users' roles and settings.
export async function notifyReviewers() {
  const admin = createAdminClient();
  const readers = await splitByLanguage(admin, await getUserIdsWithPermission(admin, REVIEW_TRANSLATIONS));

  await Promise.all(
    LANGUAGES.map((language) =>
      sendPush(readers[language], {
        title: translate(STRINGS.notificationTitle, language),
        body: translate(STRINGS.translationWaiting, language),
        url: "/admin",
        topic: "prayer-translations",
      }),
    ),
  );
}
