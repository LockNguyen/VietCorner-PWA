"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { renameGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group } from "../types";

// One group's name, editable in place. Save is enabled only when the name actually changed.
export default function GroupNameEditor({ group }: { group: Group }) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(group.name);
  const [failed, setFailed] = useState(false);
  const unchanged = name.trim() === group.name;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFailed(false);
    try {
      await renameGroup(group.id, name.trim());
      router.refresh(); // the new name is now the saved one, so Save disables again
    } catch {
      setFailed(true);
    }
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
        <button disabled={unchanged || name.trim() === ""} className="rounded border px-4 text-lg disabled:opacity-50">
          {t(STRINGS.saveName)}
        </button>
      </form>
      {failed && <p className="mt-1 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </li>
  );
}
