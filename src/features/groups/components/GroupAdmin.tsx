"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import SectionHeading from "@/components/ui/SectionHeading";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Names } from "@/features/profiles/types"; // PROFILES
import { useSave } from "@/lib/useSave";
import { createGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group, type JoinRequest } from "../types";
import GroupNameEditor from "./GroupNameEditor";
import JoinRequests from "./JoinRequests";

type Props = { groups: Group[]; requests: JoinRequest[]; names: Names }; // names: of the people in `requests`

// The admin page's section for groups: answer who is waiting to join, rename or remove a group, add one.
// Shown only to someone with the "groups.manage" permission; the database refuses everyone else anyway.
export default function GroupAdmin({ groups, requests, names }: Props) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState("");
  const { pending, save } = useSave<"add">();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const says = { done: t(STRINGS.saved), failed: t(STRINGS.couldNotSave) };
    if (await save("add", () => createGroup(name.trim()), says)) setName("");
  }

  return (
    <section>
      <JoinRequests requests={requests} groups={groups} names={names} />

      <SectionHeading>{t(STRINGS.adminHeading)}</SectionHeading>
      <ul className="flex flex-col gap-3 px-3">
        {groups.map((group) => (
          <GroupNameEditor key={group.id} group={group} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-6">
        <Field label={t(STRINGS.newGroupField)}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX_GROUP_NAME_LENGTH} />
        </Field>
        <Button variant="quiet" pending={pending === "add"} disabled={name.trim() === ""}>
          {t(STRINGS.addGroup)}
        </Button>
      </form>
    </section>
  );
}
