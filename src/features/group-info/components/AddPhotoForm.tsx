"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { STRINGS } from "../strings";
import { MAX_CAPTION_LENGTH, type NewPhoto } from "../types";

type Props = {
  onAdd: (photo: NewPhoto) => Promise<void>;
  onDone: () => void; // added, or given up
};

// Adding one picture to a group: the picture itself, and, if wanted, the day it was taken and a few words.
export default function AddPhotoForm({ onAdd, onDone }: Props) {
  const { t } = useLanguage(); // I18N
  const [file, setFile] = useState<File | null>(null);
  const [takenOn, setTakenOn] = useState("");
  const [caption, setCaption] = useState("");
  const { pending, save } = useSave<"add">();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    const says = { done: t(STRINGS.photoAdded), failed: t(STRINGS.photoFailed) };
    // Only a picture that was saved closes the form: after a failure it is still chosen, to try again.
    if (await save("add", () => onAdd({ file, takenOn, caption }), says)) onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={t(STRINGS.choosePhoto)}>
        <TextInput type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </Field>
      <Field label={t(STRINGS.takenOn)}>
        <TextInput type="date" value={takenOn} onChange={(event) => setTakenOn(event.target.value)} />
      </Field>
      <Field label={t(STRINGS.caption)}>
        <TextInput value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={MAX_CAPTION_LENGTH} />
      </Field>
      <Button pending={pending === "add"} pendingLabel={t(STRINGS.sendingPhoto)} disabled={!file}>
        {t(STRINGS.addPhoto)}
      </Button>
      <Button type="button" variant="text" onClick={onDone} disabled={pending !== null}>
        {t(STRINGS.cancel)}
      </Button>
    </form>
  );
}
