"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { saveName } from "../api";
import { STRINGS } from "../strings";
import { MAX_NAME_LENGTH } from "../types";

type Props = {
  name: string; // what the field starts with: "" when asking for the first time
  submitLabel: string;
};

// The one field that sets my name, and its button. Used when the app first asks, and again in Settings.
// The heading above it is its label, in both places.
export default function NameForm({ name: saved, submitLabel }: Props) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState(saved);
  const refresh = useRefresh();
  const showBanner = useBanner();
  const { pending, run } = usePending<"save">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Spelled out rather than `useSave`: there are two ways to succeed, and the person must know which.
    run("save", async () => {
      try {
        const outcome = await saveName(name.trim());
        await refresh();
        showBanner({ kind: "success", message: t(outcome === "saved" ? COMMON.saved : STRINGS.sentForApproval) });
      } catch {
        showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <TextInput
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="name"
        aria-label={t(STRINGS.nameField)}
      />
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
