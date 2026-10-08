"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { saveName } from "../api";
import { STRINGS } from "../strings";
import { MAX_NAME_LENGTH } from "../types";

type Props = {
  name: string; // what the field starts with: "" when asking for the first time
  submitLabel: string;
};

// The one field that sets my name, and its button. Used when the app first asks, and again in Settings.
export default function NameForm({ name: saved, submitLabel }: Props) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(saved);
  const { pending, save } = useSave<"save">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save("save", () => saveName(name.trim()), { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <Field label={t(STRINGS.nameField)}>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
        />
      </Field>
      <Button
        pending={pending === "save"}
        pendingLabel={t(COMMON.saving)}
        disabled={name.trim() === "" || name.trim() === saved}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
