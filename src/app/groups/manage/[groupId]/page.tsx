import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RefreshOnArrival from "@/components/RefreshOnArrival";
import GroupInfoForm from "@/features/group-info/components/GroupInfoForm"; // GROUP-INFO
import GroupPhotos from "@/features/group-info/components/GroupPhotos"; // GROUP-INFO
import { getGroupDirectory } from "@/features/group-info/server/queries"; // GROUP-INFO
import GroupDetailsForm from "@/features/groups/components/GroupDetailsForm";
import GroupPeople from "@/features/groups/components/GroupPeople";
import GroupThumbnail from "@/features/groups/components/GroupThumbnail";
import NewGroupForm from "@/features/groups/components/NewGroupForm";
import RemoveGroupButton from "@/features/groups/components/RemoveGroupButton";
import { getGroupPeople, getGroups } from "@/features/groups/server/queries";
import { STRINGS } from "@/features/groups/strings";
import { MANAGE_GROUPS } from "@/features/groups/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

const GROUPS = "/groups";

// One group's editor, for an admin, opened from its card on the Groups tab (or `/groups/manage/new`): its
// picture, name and size, when and where it meets, its people, its pictures, and last a small red line that
// removes it. Courtesy, not security: the database refuses every change without "groups.manage".
export default async function GroupEditorPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(MANAGE_GROUPS)) notFound();

  if (groupId === "new") {
    return (
      <>
        <PageHeader title={STRINGS.newGroup} backHref={GROUPS} />
        <NewGroupForm />
      </>
    );
  }

  // Read together: each feature brings its half of the group.
  const [groups, people, directory] = await Promise.all([
    getGroups(supabase),
    getGroupPeople(supabase),
    getGroupDirectory(supabase), // GROUP-INFO
  ]);
  const group = groups.find((each) => each.id === groupId);
  const info = directory.find((each) => each.id === groupId); // GROUP-INFO
  if (!group) notFound();

  return (
    <>
      <PageHeader title={group.name} backHref={GROUPS} />
      <RefreshOnArrival />
      <div className="flex flex-col gap-6 px-3 pt-4 pb-6">
        <GroupThumbnail group={group} />
        <GroupDetailsForm group={group} />
        {info && <GroupInfoForm group={info} />} {/* GROUP-INFO */}
        <GroupPeople
          groupId={group.id}
          members={people.filter((person) => person.group_ids.includes(group.id))}
          others={people.filter((person) => !person.group_ids.includes(group.id))}
        />
        {/* GROUP-INFO */}
        <GroupPhotos groupId={group.id} groupName={group.name} canAdd canRemove />
        <RemoveGroupButton groupId={group.id} />
      </div>
    </>
  );
}
