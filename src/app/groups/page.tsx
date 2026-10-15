import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import GroupDirectory from "@/features/group-info/components/GroupDirectory"; // GROUP-INFO
import { getGroupDirectory } from "@/features/group-info/server/queries"; // GROUP-INFO
import { MANAGE_GROUPS } from "@/features/group-info/types"; // GROUP-INFO
import GroupList from "@/features/groups/components/GroupList";
import { getGroups } from "@/features/groups/server/queries";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";
import { SWITCHES } from "@/lib/switches";

// The Groups tab. Now: every group, opening a sheet about it (`group-info`). Before, and again if
// `oldGroupsPage` is switched on: the list whose rows ask to join a group or open its chat (`groups`).
// Only the one that is drawn is read from the database and downloaded by the phone.
export default async function GroupsPage() {
  const supabase = await createClient();
  if (SWITCHES.oldGroupsPage) {
    return (
      <>
        <PageHeader title={SHELL_STRINGS.groupsTab} />
        <GroupList groups={await getGroups(supabase)} />
      </>
    );
  }

  // Read together. The permission only decides which pencils are drawn; the database decides what saves.
  const [groups, permissions] = await Promise.all([getGroupDirectory(supabase), getMyPermissions(supabase)]);

  return (
    <>
      <PageHeader title={SHELL_STRINGS.groupsTab} />
      <GroupDirectory groups={groups} canManage={permissions.includes(MANAGE_GROUPS)} />
    </>
  );
}
