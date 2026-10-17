"use client";

import { useState, type FormEvent } from "react";
import BilingualInput from "@/components/ui/BilingualInput";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Text from "@/components/ui/Text";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGE_NAMES } from "@/features/i18n/types"; // I18N
import { useSave } from "@/lib/useSave";
import { saveGroupInfo } from "../api";
import { weekdayName } from "../meeting";
import { STRINGS } from "../strings";
import {
  MAX_MEMBER_COUNT_DIGITS,
  MAX_NOTES_LENGTH,
  type DirectoryGroup,
  type GroupInfoDraft,
} from "../types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// Everything an admin types about a group, with one Save: its name and size, when it meets (a weekday and a
// time, shown as "Tuesdays @ 7:30 PM"), where, and notes. One Save, because two let a change go unsaved.
// The name and the place are one grey box each, Vietnamese on top and English under it, as on an event.
export default function GroupInfoForm({ group }: { group: DirectoryGroup }) {
  const { t, language } = useLanguage(); // I18N
  const [draft, setDraft] = useState<GroupInfoDraft>({
    name: group.name,
    nameEn: group.name_en ?? "",
    memberCount: group.member_count?.toString() ?? "",
    meetsWeekday: group.meets_weekday?.toString() ?? "",
    meetsTime: group.meets_time?.slice(0, 5) ?? "",
    location: group.location ?? "",
    locationEn: group.location_en ?? "",
    notes: group.notes ?? "",
  });
  const { pending, save } = useSave<"save">();
  const change = (field: keyof GroupInfoDraft, value: string) => setDraft({ ...draft, [field]: value });
  // One half of a bilingual box: the language's own name while it is empty, and what a screen reader says.
  const half = (field: keyof GroupInfoDraft, label: string, language: "vi" | "en") => ({
    value: draft[field],
    onChange: (value: string) => change(field, value),
    placeholder: LANGUAGE_NAMES[language],
    label: `${label} · ${LANGUAGE_NAMES[language]}`,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save("save", () => saveGroupInfo(group.id, draft), { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{t(STRINGS.groupName)}</Text>
        <BilingualInput top={half("name", t(STRINGS.groupName), "vi")} bottom={half("nameEn", t(STRINGS.groupName), "en")} />
      </div>
      <Field label={t(STRINGS.memberCountField)}>
        {/* Digits only, so what is typed is always a whole number of people, or nothing. */}
        <TextInput
          inputMode="numeric"
          value={draft.memberCount}
          onChange={(event) => change("memberCount", event.target.value.replace(/\D/g, "").slice(0, MAX_MEMBER_COUNT_DIGITS))}
        />
      </Field>
      <Field label={t(STRINGS.when)}>
        <div className="grid grid-cols-2 gap-3">
          <Select value={draft.meetsWeekday} onChange={(event) => change("meetsWeekday", event.target.value)}>
            <option value="">{t(STRINGS.pickDay)}</option>
            {WEEKDAYS.map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekdayName(weekday, language)}
              </option>
            ))}
          </Select>
          <TextInput
            type="time"
            aria-label={t(STRINGS.time)}
            value={draft.meetsTime}
            onChange={(event) => change("meetsTime", event.target.value)}
          />
        </div>
      </Field>
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{t(STRINGS.where)}</Text>
        <BilingualInput top={half("location", t(STRINGS.where), "vi")} bottom={half("locationEn", t(STRINGS.where), "en")} />
      </div>
      <TextArea
        rows={3}
        placeholder={t(STRINGS.notes)}
        aria-label={t(STRINGS.notes)}
        maxLength={MAX_NOTES_LENGTH}
        value={draft.notes}
        onChange={(event) => change("notes", event.target.value)}
      />
      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)} disabled={draft.name.trim() === ""}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
