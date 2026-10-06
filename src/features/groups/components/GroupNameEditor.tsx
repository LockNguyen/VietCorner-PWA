"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { removeGroup, renameGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group } from "../types";

// One group: its name, editable in place, and a button that removes the group.
// Save is enabled only when the name actually changed. Remove asks nothing (decided: fewer taps); the
// group is kept in the database, so a mistaken tap is undone there.
export default function GroupNameEditor({ group }: { group: Group }) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(group.name);
  const [failed, setFailed] = useState(false);
  const unchanged = name.trim() === group.name;

  async function save(change: () => Promise<void>) {
    setFailed(false);
    try {
      await change();
      router.refresh(); // reload the page's server data: the saved name, or the list without this group
    } catch {
      setFailed(true);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save(() => renameGroup(group.id, name.trim()));
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
        <button
          type="button"
          onClick={() => save(() => removeGroup(group.id))}
          className="rounded border border-red-600 px-4 text-lg text-red-600"
        >
          {t(STRINGS.removeGroup)}
        </button>
      </form>
      {failed && <p className="mt-1 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </li>
  );
}
