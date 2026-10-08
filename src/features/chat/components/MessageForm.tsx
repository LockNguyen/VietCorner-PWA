"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { STRINGS } from "../strings";

type Props = { onSend: (body: string) => Promise<void> };

// Text box + Send button. Clears immediately. If sending fails, says why in a banner and puts the text back.
export default function MessageForm({ onSend }: Props) {
  const [draft, setDraft] = useState("");
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");

    try {
      await onSend(body);
    } catch (error) {
      showBanner({ kind: "error", message: (error as Error).message }); // e.g. no network, "Not signed in"
      setDraft(body);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded border p-3 text-lg" placeholder={t(STRINGS.messagePlaceholder)} />
        <button className="rounded bg-blue-500 px-4 text-lg text-white">{t(STRINGS.sendButton)}</button>
      </form>
    </>
  );
}
