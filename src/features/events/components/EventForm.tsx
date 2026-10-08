"use client";

import { useState, type FormEvent } from "react";
import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGES, type Language } from "@/features/i18n/types"; // I18N
import { usePending } from "@/lib/usePending";
import { problemWith } from "../draft";
import { PROBLEMS, STRINGS } from "../strings";
import type { EventDraft, EventGroup } from "../types";

type Props = {
  initial: EventDraft;
  groups: EventGroup[];
  onSave: (draft: EventDraft) => Promise<boolean>; // answers whether it was saved
  onCancel: () => void;
};

// Each language's own name, written in that language: the column headings of the text fields.
const LANGUAGE_NAMES: Record<Language, string> = { en: "English", vi: "Tiếng Việt" };

// Adding or changing an event. The words are entered in both languages side by side, so a translation is
// written while the original is in view; a language left without a title is simply not stored.
// Times are church time whatever device the admin holds (draft.ts converts).
export default function EventForm({ initial, groups, onSave, onCancel }: Props) {
  const { t } = useLanguage(); // I18N
  const [draft, setDraft] = useState(initial);
  const problem = problemWith(draft);

  function setText(language: Language, field: "title" | "description" | "location", value: string) {
    setDraft({ ...draft, texts: { ...draft.texts, [language]: { ...draft.texts[language], [field]: value } } });
  }

  const [failed, setFailed] = useState(false);
  const { pending, run } = usePending<"save">(); // a second tap on Save used to create a second, identical event

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!problem) run("save", async () => setFailed(!(await onSave(draft))));
  }

  const input = "w-full rounded border p-2 text-lg";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border p-3">
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map((language) => (
          <div key={language} className="space-y-2">
            <p className="font-semibold">{LANGUAGE_NAMES[language]}</p>
            <input
              value={draft.texts[language].title}
              onChange={(event) => setText(language, "title", event.target.value)}
              placeholder={t(STRINGS.titleField)}
              className={input}
            />
            <input
              value={draft.texts[language].location}
              onChange={(event) => setText(language, "location", event.target.value)}
              placeholder={t(STRINGS.location)}
              className={input}
            />
            <textarea
              value={draft.texts[language].description}
              onChange={(event) => setText(language, "description", event.target.value)}
              placeholder={t(STRINGS.descriptionField)}
              rows={3}
              className={input}
            />
          </div>
        ))}
      </div>

      <label className="block">
        {t(STRINGS.startsField)}
        <input
          type="datetime-local"
          value={draft.startsAt}
          onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
          className={input}
        />
      </label>
      <label className="block">
        {t(STRINGS.endsField)}
        <input
          type="datetime-local"
          value={draft.endsAt}
          onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
          className={input}
        />
      </label>

      <label className="block">
        {t(STRINGS.forWhomField)}
        <select
          value={draft.groupId ?? ""}
          onChange={(event) => setDraft({ ...draft, groupId: event.target.value || null })}
          className={input}
        >
          <option value="">{t(STRINGS.churchWide)}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-lg">
        <input
          type="checkbox"
          checked={draft.repeatsWeekly}
          onChange={(event) => setDraft({ ...draft, repeatsWeekly: event.target.checked })}
          className="h-5 w-5"
        />
        {t(STRINGS.everyWeek)}
      </label>
      {draft.repeatsWeekly && (
        <label className="block">
          {t(STRINGS.repeatUntilField)}
          <input
            type="date"
            value={draft.repeatUntil}
            onChange={(event) => setDraft({ ...draft, repeatUntil: event.target.value })}
            className={input}
          />
        </label>
      )}

      {problem && <p className="text-gray-500">{t(PROBLEMS[problem])}</p>}
      {failed && (
        <p role="alert" className="text-red-600">
          {t(STRINGS.couldNotSave)}
        </p>
      )}
      <ActionButton
        pending={pending === "save"}
        pendingLabel={t(STRINGS.saving)}
        disabled={Boolean(problem)}
        className="w-full rounded bg-blue-500 p-3 text-lg text-white"
      >
        {t(STRINGS.save)}
      </ActionButton>
      <button type="button" onClick={onCancel} className="w-full rounded border p-3 text-lg">
        {t(STRINGS.close)}
      </button>
    </form>
  );
}
