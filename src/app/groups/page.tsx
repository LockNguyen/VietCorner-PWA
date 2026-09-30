import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import EnableNotificationsButton from "@/features/chat/components/EnableNotificationsButton";
import GroupList from "@/features/chat/components/GroupList";
import { getGroups } from "@/features/chat/server/queries";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const groups = await getGroups(await createClient());

  return (
    <>
      <PageHeader title={SHELL_STRINGS.groupsTab} />
      <EnableNotificationsButton />
      <GroupList groups={groups} />
    </>
  );
}
