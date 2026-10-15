import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES } from "@/features/i18n/types"; // I18N
import { getUserIdsWithPermission } from "@/features/permissions/server/queries"; // PERMISSIONS
import { USE_THE_APP } from "@/features/permissions/types"; // PERMISSIONS
import { getNames } from "@/features/profiles/server/queries"; // PROFILES
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { sendPushOnce } from "@/features/push/server/sendPushOnce"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { isWaiting, STRINGS } from "../strings";
import { MANAGE_ACCOUNTS } from "../types";
import { APP_NAME } from "@/lib/appName";

// The two notifications around being let in. Each person reads theirs in their own language.
// Uses the admin client because RLS (correctly) hides other users' roles, names and settings.

// Tells everyone who can approve that `userId` is waiting. Without this, nothing would bring an admin to
// the Admin tab. Sent once per account, however often the waiting screen asks (sendPushOnce), and never
// for an account that is already in: any signed-in person can call the route this sits behind.
export async function notifyAdminsOfArrival(userId: string) {
  const admin = createAdminClient();
  if ((await getUserIdsWithPermission(admin, USE_THE_APP)).includes(userId)) return;

  const [names, readers] = await Promise.all([
    getNames(admin, [userId]),
    getUserIdsWithPermission(admin, MANAGE_ACCOUNTS).then((admins) => splitByLanguage(admin, admins)),
  ]);

  await Promise.all(
    LANGUAGES.map((language) =>
      sendPushOnce(`sign-up:${userId}:${language}`, readers[language], {
        title: translate(STRINGS.newAccount, language),
        body: translate(isWaiting(names[userId] ?? "?"), language),
        url: "/admin",
      }),
    ),
  );
}

// Tells the person they are in. No topic: it is their one answer, and it must arrive.
export async function notifyApproved(userId: string) {
  const readers = await splitByLanguage(createAdminClient(), [userId]);

  await Promise.all(
    LANGUAGES.map((language) =>
      sendPush(readers[language], { title: APP_NAME, body: translate(STRINGS.youAreIn, language), url: "/" }),
    ),
  );
}
