"use client";

import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { GO_FORWARD } from "@/lib/slide";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import LiveDot from "@/components/ui/LiveDot";
import MemberCircles from "@/components/ui/MemberCircles";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { AVATAR_BUCKET } from "@/features/profiles/types"; // PROFILES
import { publicFileUrl } from "@/lib/publicFileUrl";
import { SWITCHES } from "@/lib/switches";
import { useFresh } from "@/lib/useFresh";
import { getGroupDirectory } from "../api";
import { locationText, nameText } from "../bilingual";
import { formatMeeting } from "../meeting";
import { members, STRINGS } from "../strings";
import { GROUP_THUMBNAIL_BUCKET, MAX_CIRCLES, type DirectoryGroup } from "../types";

type Props = {
  groups: DirectoryGroup[]; // as the page loaded them
  // Holds "groups.manage": a + for a new group (a card opens the group's page for everyone; its Edit is there).
  canManage: boolean;
  last?: ReactNode; // after the groups, for an admin: everyone who is in no group yet (the groups feature)
};

// The Groups tab: a card per group, to scroll through. Each shows its picture, a lively green dot, its name,
// when and where it meets, and a circle per person. Shows what the page loaded, then keeps itself fresh.
// why: two cards fill a phone's screen; their pictures load at once, the ones further down only near the screen
// (each is up to 400 KB: groups' PICTURE_SIDE).
const CARDS_ON_FIRST_SCREEN = 2;

export default function GroupDirectory({ groups: loaded, canManage, last }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const groups = useFresh(loaded, getGroupDirectory);

  return (
    <div className="flex flex-col gap-4 px-3 pt-2 pb-4">
      {canManage && (
        <div className="flex justify-end">
          <IconButton tone="filled" label={t(STRINGS.addGroup)} onClick={() => router.replace("/groups/manage/new", { transitionTypes: GO_FORWARD })}>
            <Plus />
          </IconButton>
        </div>
      )}
      {groups.length === 0 && <EmptyState message={t(STRINGS.noGroups)} />}

      {groups.map((group, index) => {
        const when = formatMeeting(group.meets_weekday, group.meets_time, language) ?? group.meets_at;
        const total = group.member_count ?? group.members.length;
        // A member's own picture in their circle, else their initials (the user, 2026-10-22).
        const people = group.members.map(({ initials, avatar }) => ({
          initials,
          src: avatar ? publicFileUrl(AVATAR_BUCKET, avatar) : undefined,
        }));
        return (
          <Card
            key={group.id}
            src={group.thumbnail_path ? publicFileUrl(GROUP_THUMBNAIL_BUCKET, group.thumbnail_path) : undefined}
            lazyPicture={index >= CARDS_ON_FIRST_SCREEN}
            placeholder={<Users className="size-8" />}
            badge={<LiveDot />}
            title={t(nameText(group))}
            subtitle={[when, SWITCHES.groupLocation && t(locationText(group))].filter(Boolean).join(" · ") || undefined}
            onClick={() => router.replace(`/groups/${group.id}/about`, { transitionTypes: GO_FORWARD })}
          >
            {total > 0 && (
              <MemberCircles people={people} total={total} max={MAX_CIRCLES} label={t(members(total))} />
            )}
          </Card>
        );
      })}

      {last}
    </div>
  );
}
