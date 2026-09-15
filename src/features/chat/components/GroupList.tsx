import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JoinButton from "./JoinButton";

// All groups. Joined groups open the chat; others show a Join button.
export default async function GroupList() {
  const supabase = await createClient();
  const [{ data: groups }, { data: memberships }] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("group_members").select("group_id"), // RLS returns only my memberships
  ]);

  const myGroupIds = new Set((memberships ?? []).map((m) => m.group_id));

  return (
    <ul>
      {(groups ?? []).map((group) => (
        <li key={group.id} className="border-b">
          {myGroupIds.has(group.id) ? (
            <Link href={`/groups/${group.id}`} className="flex justify-between p-4 text-lg">
              {group.name} <span className="text-gray-400">›</span>
            </Link>
          ) : (
            <div className="flex items-center justify-between p-4 text-lg">
              {group.name} <JoinButton groupId={group.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
