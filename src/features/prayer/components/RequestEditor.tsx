"use client";

import { useState, type FormEvent } from "react";
import ActionButton from "@/components/ui/ActionButton";
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_BODY_LENGTH}
        rows={5}
        autoFocus
        className="w-full rounded border p-2 text-lg"
      />
      <ActionButton
        pending={saving}
        pendingLabel={t(STRINGS.saving)}
        disabled={draft.trim() === "" || unchanged}
        className="w-full rounded bg-blue-500 p-3 text-lg text-white"
      >
        {t(STRINGS.saveEdit)}
      </ActionButton>
      <button type="button" onClick={onCancel} className="w-full rounded border p-3 text-lg">
        {t(STRINGS.cancel)}
      </button>
    </form>
  );
}
