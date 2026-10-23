"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import SectionHeading from "@/components/ui/SectionHeading";
import Select from "@/components/ui/Select";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { clockTime, weekdayName } from "@/features/i18n/clock"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { useFresh } from "@/lib/useFresh";
import { addReminder, getPrayerReminders } from "../api";
import { churchWeekday } from "../reminders";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";
import PrayerReminderRow from "./PrayerReminderRow";

type Props = { reminders: PrayerReminder[] };

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// The prayer reminders screen (the bell on the Prayer tab): when the whole church gets "time to pray", every
// week, in church time. For someone with "prayer.reminders"; the database refuses everyone else.
export default function PrayerReminderAdmin({ reminders: loaded }: Props) {
  const reminders = useFresh(loaded, getPrayerReminders); // the kept copy at once, then a fresh read on arrival
  const refresh = useRefresh();
  const { t, language } = useLanguage(); // I18N
  // Starts on today (at church): a reminder is most often set for the day it is thought of, and a list
  // that starts on Sunday made "add one for tonight" land four days away.
  const [weekday, setWeekday] = useState(() => churchWeekday(new Date()));
  const [sendAt, setSendAt] = useState("19:00");
  const showBanner = useBanner();
  const { pending, run } = usePending<"add">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Spelled out rather than `useSave`: "already exists" is a third outcome, neither saved nor failed.
    run("add", async () => {
      try {
        if ((await addReminder(weekday, sendAt)) === "exists") {
          return showBanner({ kind: "error", message: t(STRINGS.reminderExists) });
        }
        await refresh();
        showBanner({ kind: "success", message: t(COMMON.saved) });
      } catch {
        showBanner({ kind: "error", message: t(STRINGS.failed) });
      }
    });
  }

  return (
    <section>
      <SectionHeading>{t(STRINGS.remindersHeading)}</SectionHeading>
      <ul>
        {reminders.map((reminder) => (
          <PrayerReminderRow key={reminder.id} reminder={reminder} when={`${weekdayName(reminder.weekday, language)} · ${clockTime(reminder.send_at, language)}`} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-6">
        <Field label={t(STRINGS.dayField)}>
          <Select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {weekdayName(day, language)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t(STRINGS.timeField)}>
          <TextInput type="time" value={sendAt} onChange={(event) => setSendAt(event.target.value)} />
        </Field>
        <Button variant="quiet" pending={pending === "add"} disabled={!sendAt}>
          {t(STRINGS.addReminder)}
        </Button>
      </form>
    </section>
  );
}
