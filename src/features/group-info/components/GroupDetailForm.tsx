"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { STRINGS } from "../strings";

type Props = {
  label: string;
  initial: string;
  kind: "line" | "lines" | "number"; // one line of text, several, or digits only
  maxLength: number;
  onSave: (text: string) => Promise<void>;
  onDone: () => void; // saved, or given up
};

// Changing one thing about a group, in place of its line: one box, Save and Cancel.
export default function GroupDetailForm({ label, initial, kind, maxLength, onSave, onDone }: Props) {
  const { t } = useLanguage(); // I18N
  const [text, setText] = useState(initial);
  const { pending, save } = useSave<"save">();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };
    // Only a save that worked leaves the form: after a failure the words are still there to send again.
    if (await save("save", () => onSave(text), says)) onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={label}>
        {kind === "lines" ? (
          <TextArea rows={3} value={text} onChange={(event) => setText(event.target.value)} maxLength={maxLength} autoFocus />
        ) : kind === "number" ? (
          <TextInput
            inputMode="numeric"
            value={text}
            // Digits only, so what is typed is always a whole number of people, or nothing.
            onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, maxLength))}
            autoFocus
          />
        ) : (
          <TextInput value={text} onChange={(event) => setText(event.target.value)} maxLength={maxLength} autoFocus />
        )}
      </Field>
      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)}>
        {t(COMMON.save)}
      </Button>
      <Button type="button" variant="text" onClick={onDone} disabled={pending !== null}>
        {t(STRINGS.cancel)}
      </Button>
    </form>
  );
}
