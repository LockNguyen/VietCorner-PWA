"use client";

import Link from "next/link";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { GroupWithMembership } from "../types";
import JoinButton from "./JoinButton";

// All groups. A joined group links to its page (`/groups/<id>`, where chat lives); one the user asked to
// join says so; the others show the button that asks.
export default function GroupList({ groups }: { groups: GroupWithMembership[] }) {
  const { t } = useLanguage(); // I18N

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
              {group.name}
              {group.pending ? <span className="text-gray-500">{t(STRINGS.pending)}</span> : <JoinButton groupId={group.id} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
