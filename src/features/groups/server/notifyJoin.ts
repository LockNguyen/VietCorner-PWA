import "server-only";
import { splitByLanguage } from "@/features/i18n/server/queries"; // I18N
import { translate } from "@/features/i18n/translate"; // I18N
import { LANGUAGES, type Text } from "@/features/i18n/types"; // I18N
import { getUserIdsWithPermission } from "@/features/permissions/server/queries"; // PERMISSIONS
import { sendPush } from "@/features/push/server/sendPush"; // PUSH
import { createAdminClient } from "@/lib/supabase/admin";
import { STRINGS } from "../strings";
import { MANAGE_GROUPS } from "../types";

// The two notifications around joining a group. Each person reads theirs in their own language.
// Uses the admin client because RLS (correctly) hides other users' roles and settings.

// Tells everyone who can approve that someone is waiting. Without this, nothing would bring a manager to
// the Admin tab. One topic for all requests: five people asking in a minute is one notification, not five.
export async function notifyManagersOfRequest(groupId: string) {
  const admin = createAdminClient();
  const managers = await getUserIdsWithPermission(admin, MANAGE_GROUPS);
  await notify(admin, managers, groupId, STRINGS.someoneWantsToJoin, { url: "/admin", topic: "join-requests" });
}

// Tells the person they are in. No topic: it is their one answer, and it must arrive.
export async function notifyNewMember(groupId: string, userId: string) {
  await notify(createAdminClient(), [userId], groupId, STRINGS.youHaveJoined, { url: `/groups/${groupId}` });
}

// The group's name as the title, `body` in each reader's language.
async function notify(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
  groupId: string,
  body: Text,
  where: { url: string; topic?: string },
) {
  const [{ data: group }, readers] = await Promise.all([
    admin.from("groups").select("name").eq("id", groupId).single(),
    splitByLanguage(admin, userIds),
  ]);
  if (!group) return;

  await Promise.all(
    LANGUAGES.map((language) =>
      sendPush(readers[language], { title: group.name, body: translate(body, language), ...where }),
    ),
  );
}
