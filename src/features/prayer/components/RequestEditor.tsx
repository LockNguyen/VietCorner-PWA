"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import TextArea from "@/components/ui/TextArea";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useRequestWriting } from "../hooks/useRequestWriting";
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH, type PrayerRequest } from "../types";

type Props = { request: PrayerRequest };

// Changing the words of my request, on its own screen (see PrayerComposer for why not a sheet). Only the
// words: "Hide my name" stays as it was posted. The top bar's back arrow cancels.
export default function RequestEditor({ request }: Props) {
  const { t } = useLanguage(); // I18N
  const writing = useRequestWriting();
  const [draft, setDraft] = useState(request.body);
  const { pending, run } = usePending<"save">();
  const unchanged = draft.trim() === request.body;

  function submit(event: FormEvent) {
    event.preventDefault();
    run("save", () => writing.edit(request.id, draft.trim()));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <Field label={t(STRINGS.yourWords)}>
        <TextArea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={MAX_BODY_LENGTH} rows={5} />
      </Field>
      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)} disabled={draft.trim() === "" || unchanged}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
