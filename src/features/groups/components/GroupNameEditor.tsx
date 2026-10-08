"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { removeGroup, renameGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group } from "../types";

// One group: its name, editable in place, and a button that removes the group.
// Save is enabled only when the name actually changed. Remove asks nothing (decided: fewer taps); the
// group is kept in the database, so a mistaken tap is undone there.
export default function GroupNameEditor({ group }: { group: Group }) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(group.name);
  const unchanged = name.trim() === group.name;
  const { pending, save } = useSave<"rename" | "remove">();
  const failed = t(COMMON.couldNotSave);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save("rename", () => renameGroup(group.id, name.trim()), { done: t(COMMON.saved), failed });
  }

  return (
    <li>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_GROUP_NAME_LENGTH}
          aria-label={t(STRINGS.groupName)}
        />
        <Button
          variant="quiet"
          pending={pending === "rename"}
          disabled={pending !== null || unchanged || name.trim() === ""}
        >
          {t(COMMON.save)}
        </Button>
        <Button
          type="button"
          variant="danger"
          pending={pending === "remove"}
          disabled={pending !== null}
          onClick={() => save("remove", () => removeGroup(group.id), { done: t(COMMON.removed), failed })}
        >
          {t(STRINGS.removeGroup)}
        </Button>
      </form>
    </li>
  );
}
