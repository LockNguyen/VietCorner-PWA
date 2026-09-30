"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// why: the AI service rejects anything over 1,000 characters. A spoken question is one or two sentences,
// so 500 keeps typed questions in the same range and the prompt cheap.
const MAX_QUESTION_CHARS = 500;

type Props = {
  disabled: boolean;
  onSend: (question: string) => void;
};

// Type a question and send it. Clears itself; the conversation lives in the hook, not here.
export default function Composer({ disabled, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const { t } = useLanguage(); // I18N

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    onSend(question);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_QUESTION_CHARS}
        placeholder={t(STRINGS.questionPlaceholder)}
        className="flex-1 rounded border p-3 text-lg"
      />
      <button disabled={disabled} className="rounded bg-blue-500 px-4 text-lg text-white disabled:opacity-50">
        {t(STRINGS.sendButton)}
      </button>
    </form>
  );
}
