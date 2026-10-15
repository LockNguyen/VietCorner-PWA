"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { saveGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, type Group } from "../types";

// A group's name and how many people it has, with one Save for both.
// The number is typed, not counted: many who come to a group do not use the app.
export default function GroupDetailsForm({ group }: { group: Group }) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(group.name);
  const [count, setCount] = useState(group.member_count?.toString() ?? ""); // "" = not said
  const { pending, save } = useSave<"save">();

  const memberCount = count === "" ? null : Number(count);
  const unchanged = name.trim() === group.name && memberCount === group.member_count;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };
    save("save", () => saveGroup(group.id, name.trim(), memberCount), says);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={t(STRINGS.groupName)}>
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX_GROUP_NAME_LENGTH} />
      </Field>
      <Field label={t(STRINGS.memberCountField)}>
        {/* Digits only, so what is typed is always a whole number of people, or nothing. */}
        <TextInput inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value.replace(/\D/g, "").slice(0, 4))} />
      </Field>
      <Button variant="quiet" pending={pending === "save"} pendingLabel={t(COMMON.saving)} disabled={unchanged || name.trim() === ""}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
