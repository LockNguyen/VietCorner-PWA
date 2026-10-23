"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Text from "@/components/ui/Text";
import TextArea from "@/components/ui/TextArea";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { DEFAULT_LANGUAGE, LANGUAGE_NAMES, LANGUAGES, type Language } from "@/features/i18n/types"; // I18N
import { usePending } from "@/lib/usePending";
import { useTranslationEditing } from "../hooks/useTranslationEditing";
import { STRINGS } from "../strings";
import { MAX_TRANSLATION_LENGTH, type PrayerTranslation } from "../types";

type Props = { request: PrayerTranslation; backHref: string }; // backHref: the list it was opened from

// Correcting a request's translation before members see it: the request as written, the language it is written in,
// and the translation to change (empty when the AI service could not write one). The language decides which readers
// get the translation; it is unknown when the AI service could not answer, so the reviewer sets it here, starting
// from the congregation's Vietnamese. Submit approves it; Cancel leaves it as it was.
export default function TranslationEditor({ request, backHref }: Props) {
  const { t } = useLanguage(); // I18N
  const editing = useTranslationEditing(backHref);
  const [draft, setDraft] = useState(request.translation ?? "");
  const [language, setLanguage] = useState<Language>(request.language ?? DEFAULT_LANGUAGE);
  const { pending, run } = usePending<"submit">();

  function submit(event: FormEvent) {
    event.preventDefault();
    run("submit", () => editing.submit(request, draft.trim(), language));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{t(STRINGS.originalWords)}</Text>
        <Text>{request.body}</Text>
      </div>
      <Field label={t(STRINGS.writtenIn)}>
        <Select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          {LANGUAGES.map((each) => (
            <option key={each} value={each}>
              {LANGUAGE_NAMES[each]}
            </option>
          ))}
        </Select>
      </Field>
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
