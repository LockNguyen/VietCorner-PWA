"use client";

import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SWITCHES } from "@/lib/switches";
import { locationText, nameText } from "../bilingual";
import { formatMeeting } from "../meeting";
import { STRINGS } from "../strings";
import type { DirectoryGroup } from "../types";
import ContactLine from "./ContactLine";
import GroupPhotos from "./GroupPhotos";

type Props = { group: DirectoryGroup; onClose: () => void };

// About one group, for a member: when it meets, whom to contact (call, text or copy), notes, then its
// pictures (the user, 2026-10-17). Where it meets only while `groupLocation` is on. Only what was said is
// shown, and nothing here is edited: an admin opens the group's editor instead. Its own people add pictures.
export default function GroupInfoSheet({ group, onClose }: Props) {
  const { t, language } = useLanguage(); // I18N
  const when = formatMeeting(group.meets_weekday, group.meets_time, language) ?? group.meets_at;
  const line = (label: typeof STRINGS.when, value: string | null) =>
    value && (
      <div key={label.en} className="flex flex-col">
        <Text variant="small" tone="subtle">{t(label)}</Text>
        <Text>{value}</Text>
      </div>
    );
  const saidNothing = !when && !group.contact_phone && !group.notes;

  const name = t(nameText(group));

  return (
    <Sheet title={name} closeLabel={t(COMMON.close)} onClose={onClose}>
      {saidNothing && <Text tone="subtle">{t(STRINGS.nothingYet)}</Text>}
      {line(STRINGS.when, when)}
      {SWITCHES.groupLocation && line(STRINGS.where, t(locationText(group)))}
      {group.contact_phone && <ContactLine phone={group.contact_phone} />}
      {line(STRINGS.notes, group.notes)}
      <GroupPhotos groupId={group.id} groupName={name} canAdd={group.is_member} canRemove={false} />
    </Sheet>
  );
}
