"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ListRow from "@/components/ui/ListRow";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { useFresh } from "@/lib/useFresh";
import { getGroupDirectory } from "../api";
import { members, STRINGS } from "../strings";
import { GROUP_THUMBNAIL_BUCKET, type DirectoryGroup } from "../types";
import GroupInfoSheet from "./GroupInfoSheet";

type Props = {
  groups: DirectoryGroup[]; // as the page loaded them
  canManage: boolean; // the signed-in person holds "groups.manage" (the page reads it from their token)
};

// The Groups tab: every group, with when it meets under its name. Tapping one opens a sheet about it.
// Shows what the page loaded, then keeps itself fresh.
export default function GroupDirectory({ groups: loaded, canManage }: Props) {
  const { t } = useLanguage(); // I18N
  const groups = useFresh(loaded, getGroupDirectory);
  const [openId, setOpenId] = useState<string | null>(null);
  // Found again on every render, so the sheet shows the newest details and closes if its group is removed.
  const open = groups.find((group) => group.id === openId);
  if (groups.length === 0) return <EmptyState message={t(STRINGS.noGroups)} />;

  return (
    <>
      <ul>
        {groups.map((group) => (
          <ListRow
            key={group.id}
            leading={
              <Thumbnail src={group.thumbnail_path ? publicFileUrl(GROUP_THUMBNAIL_BUCKET, group.thumbnail_path) : undefined}>
                <Users />
              </Thumbnail>
            }
            title={group.name}
            subtitle={[group.is_member && t(STRINGS.myGroup), group.member_count !== null && t(members(group.member_count)), group.meets_at]
              .filter(Boolean)
              .join(" · ")}
            onClick={() => setOpenId(group.id)}
          />
        ))}
      </ul>
      {open && <GroupInfoSheet key={open.id} group={open} canManage={canManage} onClose={() => setOpenId(null)} />}
    </>
  );
}
