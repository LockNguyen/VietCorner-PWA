"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGE_NAMES, LANGUAGES, type Language } from "@/features/i18n/types"; // I18N
import { usePending } from "@/lib/usePending";
import { problemWith, type DraftProblem } from "../draft";
import { PROBLEMS, STRINGS } from "../strings";
import type { EventDraft, EventGroup } from "../types";

type Props = {
  initial: EventDraft;
  groups: EventGroup[];
  onSave: (draft: EventDraft) => Promise<void>;
};

type TextField = "title" | "location" | "description";
const TEXT_FIELDS = [
  { field: "title", label: STRINGS.titleField },
  { field: "location", label: STRINGS.location },
  { field: "description", label: STRINGS.descriptionField },
] as const;

// Adding or changing an event. Each text is asked in one language, then the other, so a translation is
// written under its original. Times are church time whatever device the admin holds (draft.ts converts).
export default function EventForm({ initial, groups, onSave }: Props) {
  const { t } = useLanguage(); // I18N
  const [draft, setDraft] = useState(initial);
  // What is wrong is said once Save has been tried, and from then on as the fields change.
  const [tried, setTried] = useState(false);
  const problem = problemWith(draft);
  const said = (cause: DraftProblem) => (tried && problem === cause ? t(PROBLEMS[cause]) : undefined);
  const { pending, run } = usePending<"save">();

  function setText(language: Language, field: TextField, value: string) {
    setDraft({ ...draft, texts: { ...draft.texts, [language]: { ...draft.texts[language], [field]: value } } });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (!problem) run("save", () => onSave(draft));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-3 pt-4">
      {TEXT_FIELDS.map(({ field, label }) =>
        LANGUAGES.map((language) => {
          const control = {
            value: draft.texts[language][field],
            onChange: (change: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(language, field, change.target.value),
          };
          return (
            <Field
              key={`${field}-${language}`}
              label={`${t(label)} · ${LANGUAGE_NAMES[language]}`}
              problem={field === "title" && language === LANGUAGES[0] ? said("noTitle") : undefined}
            >
              {field === "description" ? <TextArea rows={3} {...control} /> : <TextInput {...control} />}
            </Field>
          );
        }),
      )}

      <Field label={t(STRINGS.startsField)} problem={said("noStart")}>
        <TextInput
          type="datetime-local"
          value={draft.startsAt}
          onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
        />
      </Field>
      <Field label={t(STRINGS.endsField)} problem={said("endsBeforeItStarts")}>
        <TextInput
          type="datetime-local"
          value={draft.endsAt}
          onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
        />
      </Field>

      <Field label={t(STRINGS.forWhomField)}>
        <Select value={draft.groupId ?? ""} onChange={(event) => setDraft({ ...draft, groupId: event.target.value || null })}>
          <option value="">{t(STRINGS.churchWide)}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </Field>

      <Switch
        label={t(STRINGS.everyWeek)}
        checked={draft.repeatsWeekly}
        onChange={(event) => setDraft({ ...draft, repeatsWeekly: event.target.checked })}
      />
      {draft.repeatsWeekly && (
        <Field label={t(STRINGS.repeatUntilField)}>
          <TextInput
            type="date"
            value={draft.repeatUntil}
            onChange={(event) => setDraft({ ...draft, repeatUntil: event.target.value })}
          />
        </Field>
      )}

      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
