"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Text from "@/components/ui/Text";
import TextArea from "@/components/ui/TextArea";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useTranslationEditing } from "../hooks/useTranslationEditing";
import { STRINGS } from "../strings";
import { MAX_TRANSLATION_LENGTH, type PrayerTranslation } from "../types";

type Props = { request: PrayerTranslation; backHref: string }; // backHref: the list it was opened from

// Correcting a request's translation before members see it: the request as written above, the translation to
// change below (empty when the AI service could not write one). Submit approves it; Cancel leaves it waiting.
export default function TranslationEditor({ request, backHref }: Props) {
  const { t } = useLanguage(); // I18N
  const editing = useTranslationEditing(backHref);
  const [draft, setDraft] = useState(request.translation ?? "");
  const { pending, run } = usePending<"submit">();

  function submit(event: FormEvent) {
    event.preventDefault();
    run("submit", () => editing.submit(request, draft.trim()));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{t(STRINGS.originalWords)}</Text>
        <Text>{request.body}</Text>
      </div>
      <Field label={t(STRINGS.translationField)}>
        <TextArea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={MAX_TRANSLATION_LENGTH} rows={6} />
      </Field>
      <Button pending={pending === "submit"} pendingLabel={t(COMMON.saving)} disabled={draft.trim() === ""}>
        {t(STRINGS.submitTranslation)}
      </Button>
      <Button type="button" variant="quiet" disabled={pending !== null} onClick={editing.cancel}>
        {t(COMMON.cancel)}
      </Button>
    </form>
  );
}
