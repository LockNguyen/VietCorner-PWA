"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { removeMember } from "../api";
import { STRINGS } from "../strings";
import type { Person } from "../types";

// One person in a group, name over email, with the button that takes them out of it.
// A row of its own, so removing one never blocks the others.
export default function GroupMemberRow({ groupId, person }: { groupId: string; person: Person }) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"remove">();
  const says = { done: t(COMMON.removed), failed: t(COMMON.couldNotSave) };

  return (
    <ListRow
      title={person.name}
      subtitle={person.email}
      trailing={
        <Button variant="quiet" pending={pending === "remove"} onClick={() => save("remove", () => removeMember(groupId, person.user_id), says)}>
          {t(STRINGS.removePerson)}
        </Button>
      }
    />
  );
}
