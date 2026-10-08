"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextArea from "@/components/ui/TextArea";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH } from "../types";

type Props = { body: string; saving: boolean; onSave: (body: string) => void; onCancel: () => void };

// Changing the words of a request. Only the words: the group and "Hide my name" stay as they were posted.
export default function RequestEditor({ body, saving, onSave, onCancel }: Props) {
  const { t } = useLanguage(); // I18N
  const [draft, setDraft] = useState(body);
  const unchanged = draft.trim() === body;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(draft.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label={t(STRINGS.yourWords)}>
        <TextArea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={MAX_BODY_LENGTH} rows={5} autoFocus />
      </Field>
      <Button pending={saving} pendingLabel={t(COMMON.saving)} disabled={draft.trim() === "" || unchanged}>
        {t(COMMON.save)}
      </Button>
      <Button type="button" variant="text" onClick={onCancel}>
        {t(STRINGS.cancel)}
      </Button>
    </form>
  );
}
