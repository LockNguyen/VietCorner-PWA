import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import GroupPage from "@/features/group-info/components/GroupPage";
import { getFirstPhotos, getGroupDirectory } from "@/features/group-info/server/queries";
import { MANAGE_GROUPS } from "@/features/group-info/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// One group's page, opened from its card on the Groups tab by anyone: the Groups page's own read
// (`group_directory()`), so it shows exactly what the card showed. `/groups/<id>` itself is the group's chat.
export default async function GroupAboutPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createClient();
  // The group's first pictures come with the page, read at the same time as the rest.
  const [groups, permissions, photos] = await Promise.all([
    getGroupDirectory(supabase),
    getMyPermissions(supabase),
    getFirstPhotos(supabase, groupId),
  ]);
  const group = groups.find((each) => each.id === groupId);
  if (!group) notFound();

  return (
    <>
      {/* The name in the reader's language, or the Vietnamese one while there is no English. */}
      <PageHeader title={{ vi: group.name, en: group.name_en ?? "" }} backHref="/groups" />
      <GroupPage group={group} groups={groups} photos={photos} canManage={permissions.includes(MANAGE_GROUPS)} />
    </>
  );
}
