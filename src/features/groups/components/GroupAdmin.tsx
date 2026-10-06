"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { createGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group, type JoinRequest } from "../types";
import GroupNameEditor from "./GroupNameEditor";
import JoinRequests from "./JoinRequests";

// The admin page's section for groups: answer who is waiting to join, rename or remove a group, add one.
// Shown only to someone with the "groups.manage" permission; the database refuses everyone else anyway.
export default function GroupAdmin({ groups, requests }: { groups: Group[]; requests: JoinRequest[] }) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFailed(false);
    try {
      await createGroup(name.trim());
      setName("");
      router.refresh(); // reload the page's server data so the new group joins the list
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className="p-4">
      <h2 className="mb-2 border-b pb-1 text-lg font-semibold">{t(STRINGS.adminHeading)}</h2>

      <JoinRequests requests={requests} groups={groups} />

      <ul className="space-y-2">
        {groups.map((group) => (
          <GroupNameEditor key={group.id} group={group} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t(STRINGS.newGroupPlaceholder)}
          maxLength={MAX_GROUP_NAME_LENGTH}
          className="min-w-0 flex-1 rounded border p-2 text-lg"
        />
        <button disabled={name.trim() === ""} className="rounded bg-blue-500 px-4 text-lg text-white disabled:opacity-50">
          {t(STRINGS.addGroup)}
        </button>
      </form>
      {failed && <p className="mt-2 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </section>
  );
}
