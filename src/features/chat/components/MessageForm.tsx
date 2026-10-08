"use client";

import { useState } from "react";
import Composer from "@/components/ui/Composer";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { STRINGS } from "../strings";

type Props = { onSend: (body: string) => Promise<void> };

// Writing a message. The field clears at once; if sending fails, a banner says so and the words come back.
export default function MessageForm({ onSend }: Props) {
  const [draft, setDraft] = useState("");
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");

    try {
      await onSend(body);
    } catch {
      showBanner({ kind: "error", message: t(STRINGS.couldNotSend) });
      setDraft(body);
    }
  }

  return (
    <Composer
      value={draft}
      onChange={setDraft}
      onSend={send}
      placeholder={t(STRINGS.messagePlaceholder)}
      sendLabel={t(STRINGS.sendButton)}
      disabled={draft.trim() === ""}
    />
  );
}
