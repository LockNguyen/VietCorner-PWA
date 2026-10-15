import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Text from "@/components/ui/Text";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import PersonGroups from "@/features/groups/components/PersonGroups"; // GROUPS
import { getGroups } from "@/features/groups/server/queries"; // GROUPS
import PersonRoles from "@/features/people/components/PersonRoles";
import RemovePersonButton from "@/features/people/components/RemovePersonButton";
import { getPeople } from "@/features/people/server/queries";
import { MANAGE_USERS } from "@/features/people/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// One person, for an admin: their email, what they may do, which groups they are in, and last a small red line
// that removes them. Courtesy, not security: every change is a database function that checks "users.manage".
export default async function PersonPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const [permissions, people, groups, me] = await Promise.all([
    getMyPermissions(supabase),
    getPeople(supabase),
    getGroups(supabase), // GROUPS
    getCurrentUser(supabase), // AUTH
  ]);
  if (!permissions.includes(MANAGE_USERS)) notFound();
  const person = people.find((each) => each.user_id === userId);
  if (!person) notFound();
  const isMe = me?.id === person.user_id;

  return (
    <>
      <PageHeader title={person.name} backHref="/admin" />
      <div className="flex flex-col gap-6 pb-6">
        <div className="px-3 pt-4">
          <Text tone="subtle">{person.email}</Text>
        </div>
        <PersonRoles userId={person.user_id} roles={person.roles} isMe={isMe} />
        <PersonGroups userId={person.user_id} groups={groups} memberOf={person.group_ids} /> {/* GROUPS */}
        {!isMe && (
          <div className="flex flex-col px-3">
            <RemovePersonButton userId={person.user_id} />
          </div>
        )}
      </div>
    </>
  );
}
