"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { addMember } from "../api";
import { STRINGS } from "../strings";
import type { Person } from "../types";

type Props = { groupId: string; people: Person[] }; // people: everyone not in the group yet

// Puts one person into a group: a list of everyone not in it, by name with their email, and Add.
// The email is beside the name because two people can share a name.
export default function AddMemberForm({ groupId, people }: Props) {
  const { t } = useLanguage(); // I18N
  const [userId, setUserId] = useState("");
  const { pending, save } = useSave<"add">();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const says = { done: t(STRINGS.added), failed: t(COMMON.couldNotSave) };
    if (await save("add", () => addMember(groupId, userId), says)) setUserId("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={t(STRINGS.addPersonField)}>
        <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
          <option value="">{t(STRINGS.choosePerson)}</option>
          {people.map((person) => (
            <option key={person.user_id} value={person.user_id}>
              {person.name} ({person.email})
            </option>
          ))}
        </Select>
      </Field>
      <Button variant="quiet" pending={pending === "add"} disabled={userId === ""}>
        {t(STRINGS.addPerson)}
      </Button>
    </form>
  );
}
