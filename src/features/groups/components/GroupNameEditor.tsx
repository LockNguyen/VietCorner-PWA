"use client";

import { useState, type FormEvent } from "react";
import ActionButton from "@/components/ui/ActionButton";
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
  const failed = t(STRINGS.couldNotSave);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save("rename", () => renameGroup(group.id, name.trim()), { done: t(STRINGS.saved), failed });
  }

  return (
    <li>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_GROUP_NAME_LENGTH}
          className="min-w-0 flex-1 rounded border p-2 text-lg"
        />
        <ActionButton
          pending={pending === "rename"}
          pendingLabel={t(STRINGS.saving)}
          disabled={pending !== null || unchanged || name.trim() === ""}
          className="rounded border px-4 text-lg"
        >
          {t(STRINGS.saveName)}
        </ActionButton>
        <ActionButton
          type="button"
          pending={pending === "remove"}
          disabled={pending !== null}
          onClick={() => save("remove", () => removeGroup(group.id), { done: t(STRINGS.removed), failed })}
          className="rounded border border-red-600 px-4 text-lg text-red-600"
        >
          {t(STRINGS.removeGroup)}
        </ActionButton>
      </form>
    </li>
  );
}
