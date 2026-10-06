import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import GroupAdmin from "@/features/groups/components/GroupAdmin";
import { getGroups } from "@/features/groups/server/queries";
import { MANAGE_GROUPS } from "@/features/groups/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// The admin page is a list of sections, one per thing that can be managed. Each feature brings its own
// section and names the permission it needs; this page only decides which sections this user gets.
// So a future "post writer" sees this page with one section, and removing a feature removes its section.
export default async function AdminPage() {
  const supabase = await createClient();
  const permissions = await getMyPermissions(supabase);
  // A member has no business here. This is courtesy, not security: with a forged token the page would
  // render, and every save would still be refused by the database.
  if (permissions.length === 0) notFound();

  return (
    <>
      <PageHeader title={SHELL_STRINGS.adminTab} />
      {permissions.includes(MANAGE_GROUPS) && <GroupAdmin groups={await getGroups(supabase)} />}
    </>
  );
}
