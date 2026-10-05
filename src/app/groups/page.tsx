import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EnableNotificationsButton from "@/features/chat/components/EnableNotificationsButton"; // CHAT
import GroupList from "@/features/groups/components/GroupList";
import { getGroups } from "@/features/groups/server/queries";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const groups = await getGroups(await createClient());

  return (
    <>
      <PageHeader title={SHELL_STRINGS.groupsTab} />
      <EnableNotificationsButton /> {/* CHAT */}
      <GroupList groups={groups} />
    </>
  );
}
