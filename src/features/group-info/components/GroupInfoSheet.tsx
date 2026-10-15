"use client";

import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatMeeting } from "../meeting";
import { members, STRINGS } from "../strings";
import type { DirectoryGroup } from "../types";
import GroupPhotos from "./GroupPhotos";

type Props = { group: DirectoryGroup; onClose: () => void };

// About one group, for a member: when and where it meets, notes, then its pictures. Only what was said is
// shown, and nothing here is edited: an admin opens the group's editor instead (the Groups tab).
// The group's own people may add pictures.
export default function GroupInfoSheet({ group, onClose }: Props) {
  const { t, language } = useLanguage(); // I18N
  const when = formatMeeting(group.meets_weekday, group.meets_time, language) ?? group.meets_at;
  const lines = [
    { label: STRINGS.when, value: when },
    { label: STRINGS.where, value: group.location },
    { label: STRINGS.notes, value: group.notes },
    { label: STRINGS.membersLabel, value: group.member_count !== null ? t(members(group.member_count)) : null },
  ].filter((line) => line.value);

  return (
    <Sheet title={group.name} closeLabel={t(COMMON.close)} onClose={onClose}>
      {lines.length === 0 && <Text tone="subtle">{t(STRINGS.nothingYet)}</Text>}
      {lines.map(({ label, value }) => (
        <div key={label.en} className="flex flex-col">
          <Text variant="small" tone="subtle">{t(label)}</Text>
          <Text>{value}</Text>
        </div>
      ))}
      <GroupPhotos groupId={group.id} groupName={group.name} canAdd={group.is_member} canRemove={false} />
    </Sheet>
  );
}
