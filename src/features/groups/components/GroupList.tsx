"use client";

import { Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ListRow from "@/components/ui/ListRow";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { GroupWithMembership } from "../types";
import JoinButton from "./JoinButton";

// All groups. A joined group opens its page (`/groups/<id>`, where chat lives); one the user asked to join
// says so; the others carry the button that asks.
export default function GroupList({ groups }: { groups: GroupWithMembership[] }) {
  const { t } = useLanguage(); // I18N
  if (groups.length === 0) return <EmptyState message={t(STRINGS.noGroups)} />;

  return (
    <ul>
      {groups.map((group) => {
        const picture = <Thumbnail><Users /></Thumbnail>;
        if (group.joined) {
          return <ListRow key={group.id} href={`/groups/${group.id}`} leading={picture} title={group.name} subtitle={t(STRINGS.joined)} />;
        }
        if (group.pending) {
          return <ListRow key={group.id} leading={picture} title={group.name} subtitle={t(STRINGS.pending)} />;
        }
        return <ListRow key={group.id} leading={picture} title={group.name} trailing={<JoinButton groupId={group.id} />} />;
      })}
    </ul>
  );
}
