"use client";

import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import LiveDot from "@/components/ui/LiveDot";
import MemberCircles from "@/components/ui/MemberCircles";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { useFresh } from "@/lib/useFresh";
import { getGroupDirectory } from "../api";
import { formatMeeting } from "../meeting";
import { members, STRINGS } from "../strings";
import { GROUP_THUMBNAIL_BUCKET, MAX_CIRCLES, type DirectoryGroup } from "../types";
import GroupInfoSheet from "./GroupInfoSheet";

type Props = {
  groups: DirectoryGroup[]; // as the page loaded them
  // Holds "groups.manage": a + for a new group, and a card opens the group's editor instead of its sheet.
  canManage: boolean;
  last?: ReactNode; // after the groups, for an admin: everyone who is in no group yet (the groups feature)
};

// The Groups tab: a card per group, to scroll through. Each shows its picture, a lively green dot, its name,
// when and where it meets, and a circle per person. Shows what the page loaded, then keeps itself fresh.
export default function GroupDirectory({ groups: loaded, canManage, last }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const groups = useFresh(loaded, getGroupDirectory);
  const [openId, setOpenId] = useState<string | null>(null);
  // Found again on every render, so the sheet shows the newest details and closes if its group is removed.
  const open = groups.find((group) => group.id === openId);

  return (
    <div className="flex flex-col gap-4 px-3 pt-2 pb-4">
      {canManage && (
        <div className="flex justify-end">
          <IconButton tone="filled" label={t(STRINGS.addGroup)} onClick={() => router.push("/groups/manage/new")}>
            <Plus />
          </IconButton>
        </div>
      )}
      {groups.length === 0 && <EmptyState message={t(STRINGS.noGroups)} />}

      {groups.map((group) => {
        const when = formatMeeting(group.meets_weekday, group.meets_time, language) ?? group.meets_at;
        const total = group.member_count ?? group.member_initials.length;
        return (
          <Card
            key={group.id}
            src={group.thumbnail_path ? publicFileUrl(GROUP_THUMBNAIL_BUCKET, group.thumbnail_path) : undefined}
            placeholder={<Users className="size-8" />}
            badge={<LiveDot />}
            title={group.name}
            subtitle={[when, group.location].filter(Boolean).join(" · ") || undefined}
            onClick={() => (canManage ? router.push(`/groups/manage/${group.id}`) : setOpenId(group.id))}
          >
            {total > 0 && (
              <MemberCircles initials={group.member_initials} total={total} max={MAX_CIRCLES} label={t(members(total))} />
            )}
          </Card>
        );
      })}

      {last}
      {open && <GroupInfoSheet key={open.id} group={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
