"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import BilingualInput from "@/components/ui/BilingualInput";
import Switch from "@/components/ui/Switch";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGE_NAMES, type Language } from "@/features/i18n/types"; // I18N
import { usePending } from "@/lib/usePending";
import { problemWith, type DraftProblem } from "../draft";
import { PROBLEMS, STRINGS } from "../strings";
import { MAX_ADDRESS_LENGTH, MAX_PHONE_LENGTH, type EventDraft } from "../types";

type Props = {
  initial: EventDraft;
  onSave: (draft: EventDraft) => Promise<void>;
};

// The two texts written in both languages. The description is no longer asked: since the event's own page went
// (2026-10-19) no screen shows it; saved ones stay in `event_texts`.
type TextField = "title" | "location";

// Adding or changing an event, in the order the card shows it (the user, 2026-10-20: the editor did not match
// what was displayed): title, time, place, address, contact, each with a grey line saying where it appears.
// Each text is one grey box, Vietnamese on top and English under it, so a translation is written right under its
// original. Times are church time whatever device the admin holds (draft.ts converts).
export default function EventForm({ initial, onSave }: Props) {
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

  // One text in both languages: its name, the box, where it shows, and what is wrong with it.
  function bilingual(field: TextField, label: string, hint: string, problem?: string) {
    const part = (language: Language) => ({
      value: draft.texts[language][field],
      onChange: (value: string) => setText(language, field, value),
      placeholder: LANGUAGE_NAMES[language],
      label: `${label} · ${LANGUAGE_NAMES[language]}`,
    });
    return (
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{label}</Text>
        <BilingualInput top={part("vi")} bottom={part("en")} />
        <Text variant="small" tone="subtle">{hint}</Text>
        {problem && <Text variant="small" tone="danger">{problem}</Text>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-3 pt-4">
      {bilingual("title", t(STRINGS.titleField), t(STRINGS.titleHint), said("noTitle"))}

      {/* A weekly event keeps its first date here, while the card shows the next one: say so. */}
      <Field label={t(STRINGS.startsField)} hint={draft.repeatsWeekly ? t(STRINGS.firstDateHint) : undefined} problem={said("noStart")}>
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

      {bilingual("location", t(STRINGS.location), t(STRINGS.locationHint))}

      <Field label={t(STRINGS.addressField)} hint={t(STRINGS.addressHint)}>
        <TextInput
          autoComplete="off"
          placeholder="134 S Peace Haven Rd (SeChrist Building)"
          maxLength={MAX_ADDRESS_LENGTH}
          value={draft.address}
          onChange={(event) => setDraft({ ...draft, address: event.target.value })}
        />
      </Field>

      <Field label={t(STRINGS.contactField)} hint={t(STRINGS.contactHint)}>
        <TextInput
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="(336) 555-0101"
          maxLength={MAX_PHONE_LENGTH}
          value={draft.contactPhone}
          onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })}
        />
      </Field>

      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
