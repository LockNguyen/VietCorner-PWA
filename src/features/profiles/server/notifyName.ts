import "server-only";
import { MANAGE_GROUPS } from "@/features/groups/types"; // GROUPS: whoever lets people in also answers names
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES, type Text } from "@/features/i18n/types"; // I18N
import { getUserIdsWithPermission } from "@/features/permissions/server/queries"; // PERMISSIONS
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { STRINGS } from "../strings";

// The two notifications around a name change. Each person reads theirs in their own language.
// Uses the admin client because RLS (correctly) hides other users' roles and settings.

// Tells everyone who can approve that a name is waiting. One topic: five requests in a minute are one notification.
export async function notifyManagersOfNameRequest() {
  const admin = createAdminClient();
  const managers = await getUserIdsWithPermission(admin, MANAGE_GROUPS);
  await notify(admin, managers, STRINGS.someoneAsksForName, { url: "/admin", topic: "name-requests" });
}

// Tells the person their new name is in use. No topic: it is their one answer, and it must arrive.
// A declined request tells nobody (decided 2026-10-08).
export async function notifyOfApprovedName(userId: string) {
  await notify(createAdminClient(), [userId], STRINGS.nameApproved, { url: "/settings" });
}

async function notify(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
  body: Text,
  where: { url: string; topic?: string },
) {
  const readers = await splitByLanguage(admin, userIds);

  await Promise.all(
    LANGUAGES.map((language) =>
      sendPush(readers[language], {
        title: translate(STRINGS.nameChange, language),
        body: translate(body, language),
        ...where,
      }),
    ),
  );
}
