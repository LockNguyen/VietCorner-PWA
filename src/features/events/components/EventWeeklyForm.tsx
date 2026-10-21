"use client";

import { useState, type FormEvent } from "react";
import BilingualInput from "@/components/ui/BilingualInput";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGE_NAMES } from "@/features/i18n/types"; // I18N
import { usePending } from "@/lib/usePending";
import { useWeeklyCardSave } from "../hooks/useWeeklyCardSave";
import { STRINGS } from "../strings";
import { MAX_ADDRESS_LENGTH, MAX_PHONE_LENGTH, type WeeklyCard } from "../types";

type Props = {
  initial: WeeklyCard;
  listHref: string; // where saving leads back to
};

// The weekly card's fields, in the card's order, like the event form: the title (Vietnamese on top, English
// under it), the address, the number. The weekly lines are not here: they are the events and the groups.
export default function EventWeeklyForm({ initial, listHref }: Props) {
  const { t } = useLanguage(); // I18N
  const save = useWeeklyCardSave(listHref);
  const { pending, run } = usePending<"save">();
  const [title, setTitle] = useState(initial.title);
  const [titleEn, setTitleEn] = useState(initial.title_en ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.contact_phone ?? "");
  const [tried, setTried] = useState(false); // the missing title is said once Save has been tried
  const noTitle = title.trim() === "";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (noTitle) return;
    // An emptied box is stored as nothing, so the English title falls back to the Vietnamese one.
    const card = { title: title.trim(), title_en: titleEn.trim() || null, address: address.trim() || null, contact_phone: phone.trim() || null };
    run("save", () => save(card));
  }

  const part = (value: string, onChange: (value: string) => void, language: "vi" | "en") => ({
    value,
    onChange,
    placeholder: LANGUAGE_NAMES[language],
    label: `${t(STRINGS.cardTitleField)} · ${LANGUAGE_NAMES[language]}`,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-3 pt-4">
      <div className="flex flex-col gap-1">
        <Text variant="small" tone="subtle">{t(STRINGS.cardTitleField)}</Text>
        <BilingualInput top={part(title, setTitle, "vi")} bottom={part(titleEn, setTitleEn, "en")} />
        <Text variant="small" tone="subtle">{t(STRINGS.cardTitleHint)}</Text>
        {tried && noTitle && <Text variant="small" tone="danger">{t(STRINGS.noCardTitle)}</Text>}
      </div>

      <Field label={t(STRINGS.addressField)} hint={t(STRINGS.addressHint)}>
        <TextInput
          autoComplete="off"
          placeholder="134 S Peace Haven Rd (SeChrist Building)"
          maxLength={MAX_ADDRESS_LENGTH}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </Field>

      <Field label={t(STRINGS.contactField)} hint={t(STRINGS.contactHint)}>
        <TextInput
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="(336) 555-0101"
          maxLength={MAX_PHONE_LENGTH}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>

      <Button pending={pending === "save"} pendingLabel={t(COMMON.saving)}>
        {t(COMMON.save)}
      </Button>
    </form>
  );
}
