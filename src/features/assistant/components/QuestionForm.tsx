"use client";

import { useState, type ReactNode } from "react";
import Composer from "@/components/ui/Composer";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// why: the AI service rejects anything over 1,000 characters. A spoken question is one or two sentences,
// so 500 keeps typed questions in the same range and the prompt cheap.
const MAX_QUESTION_CHARS = 500;

type Props = {
  disabled: boolean; // an answer is on its way
  onSend: (question: string) => void;
  children: ReactNode; // what sits above the field: the microphone
};

// Type a question and send it. Clears itself; the conversation lives in the hook, not here.
export default function QuestionForm({ disabled, onSend, children }: Props) {
  const [draft, setDraft] = useState("");
  const { t } = useLanguage(); // I18N

  function send() {
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    onSend(question);
  }

  return (
    <Composer
      value={draft}
      onChange={setDraft}
      onSend={send}
      placeholder={t(STRINGS.questionPlaceholder)}
      sendLabel={t(STRINGS.sendButton)}
      disabled={disabled || draft.trim() === ""}
      maxLength={MAX_QUESTION_CHARS}
    >
      {children}
    </Composer>
  );
}
