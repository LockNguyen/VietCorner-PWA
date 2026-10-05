import Link from "next/link";
import type { GroupWithMembership } from "../types";
import JoinButton from "./JoinButton";

// All groups. A joined group links to its page (`/groups/<id>`, where chat lives); others show a Join button.
export default function GroupList({ groups }: { groups: GroupWithMembership[] }) {
  return (
    <ul>
      {groups.map((group) => (
        <li key={group.id} className="border-b">
          {group.joined ? (
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
