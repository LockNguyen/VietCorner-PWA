"use client";

import { useState } from "react";
import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { saveGroupDetail, saveMemberCount } from "../api";
import { STRINGS } from "../strings";
import {
  MAX_LOCATION_LENGTH,
  MAX_MEETS_AT_LENGTH,
  MAX_MEMBER_COUNT_DIGITS,
  MAX_NOTES_LENGTH,
  type DetailField,
  type DirectoryGroup,
} from "../types";
import GroupDetail from "./GroupDetail";
import GroupDetailForm from "./GroupDetailForm";
import GroupPhotos from "./GroupPhotos";
import { COMMON } from "@/features/i18n/common"; // I18N

type Props = {
  group: DirectoryGroup;
  canManage: boolean; // holds "groups.manage": may change every line here, and remove a picture
  onClose: () => void;
};

// The three things a group says about itself, in the order they are shown.
const DETAILS = [
  { field: "meets_at", label: STRINGS.when, kind: "line", maxLength: MAX_MEETS_AT_LENGTH },
  { field: "location", label: STRINGS.where, kind: "line", maxLength: MAX_LOCATION_LENGTH },
  { field: "notes", label: STRINGS.notes, kind: "lines", maxLength: MAX_NOTES_LENGTH },
] as const;

// Everything about one group, in a sheet over the list: how many people, then when, where and notes,
// then its pictures.
// A reader sees only what was said. A group manager sees every line, each with a pencil that turns it into
// a box. The group's own people may add pictures; only a manager removes one.
// The pencils and buttons are courtesy: the database refuses anyone else.
export default function GroupInfoSheet({ group, canManage, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [editing, setEditing] = useState<DetailField | "member_count" | null>(null);
  const saidNothing = group.member_count === null && !group.meets_at && !group.location && !group.notes;
  const stopEditing = () => setEditing(null);

  return (
    <Sheet title={group.name} closeLabel={t(COMMON.close)} onClose={onClose}>
      {saidNothing && !canManage && <Text tone="subtle">{t(STRINGS.nothingYet)}</Text>}

      {editing === "member_count" ? (
        <GroupDetailForm
          label={t(STRINGS.membersLabel)}
          initial={group.member_count?.toString() ?? ""}
          kind="number"
          maxLength={MAX_MEMBER_COUNT_DIGITS}
          onSave={(text) => saveMemberCount(group.id, text === "" ? null : Number(text))}
          onDone={stopEditing}
        />
      ) : (
        (group.member_count !== null || canManage) && (
          <GroupDetail
            label={t(STRINGS.membersLabel)}
            value={group.member_count?.toString() ?? t(STRINGS.notSaid)}
            editLabel={t(STRINGS.edit)}
            onEdit={canManage ? () => setEditing("member_count") : undefined}
          />
        )
      )}

      {DETAILS.map(({ field, label, kind, maxLength }) =>
        editing === field ? (
          <GroupDetailForm
            key={field}
            label={t(label)}
            initial={group[field] ?? ""}
            kind={kind}
            maxLength={maxLength}
            onSave={(text) => saveGroupDetail(group.id, field, text)}
            onDone={stopEditing}
          />
        ) : (
          (group[field] || canManage) && (
            <GroupDetail
              key={field}
              label={t(label)}
              value={group[field] ?? t(STRINGS.notSaid)}
              editLabel={t(STRINGS.edit)}
              onEdit={canManage ? () => setEditing(field) : undefined}
            />
          )
        ),
      )}

      <GroupPhotos groupId={group.id} groupName={group.name} canAdd={group.is_member || canManage} canRemove={canManage} />

    </Sheet>
  );
}
