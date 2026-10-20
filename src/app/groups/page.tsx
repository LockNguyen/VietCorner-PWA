import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import GroupDirectory from "@/features/group-info/components/GroupDirectory"; // GROUP-INFO
import { getGroupDirectory } from "@/features/group-info/server/queries"; // GROUP-INFO
import { MANAGE_GROUPS } from "@/features/group-info/types"; // GROUP-INFO
import GroupList from "@/features/groups/components/GroupList";
import UnassignedCard from "@/features/groups/components/UnassignedCard";
import { getGroupPeople, getGroups } from "@/features/groups/server/queries";
import { MANAGE_USERS } from "@/features/people/types"; // PEOPLE
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";
import { SWITCHES } from "@/lib/switches";

// The Groups tab. Now: a card per group (`group-info`): a member opens a sheet about it, an admin its editor. Before, and again if
// `oldGroupsPage` is switched on: the list whose rows ask to join a group or open its chat (`groups`).
// Only the one that is drawn is read from the database and downloaded by the phone.
export default async function GroupsPage() {
  const supabase = await createClient();
  if (SWITCHES.oldGroupsPage) {
    return (
      <>
        <PageHeader title={SHELL_STRINGS.groupsTab} backHref="/" />
        <GroupList groups={await getGroups(supabase)} />
      </>
    );
  }

  // Read together. The permission decides what is drawn (a +, cards that open an editor, and last the people
  // in no group); the database decides what saves.
  const [groups, permissions] = await Promise.all([getGroupDirectory(supabase), getMyPermissions(supabase)]);
  const canManage = permissions.includes(MANAGE_GROUPS);
  // why: "Has no group" is about people, not groups: the church admin's list (users.manage), not a group
  // manager's (the user, 2026-10-20). Only that page reads the people.
  const seesUnassigned = permissions.includes(MANAGE_USERS); // PEOPLE
  const people = seesUnassigned ? await getGroupPeople(supabase) : [];

  return (
    <>
      <PageHeader title={SHELL_STRINGS.groupsTab} backHref="/" />
      <GroupDirectory
        groups={groups}
        canManage={canManage}
        last={seesUnassigned && <UnassignedCard people={people} />}
      />
    </>
  );
}
