"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import SectionHeading from "@/components/ui/SectionHeading";
import Select from "@/components/ui/Select";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { addReminder } from "../api";
import { churchWeekday } from "../reminders";
import { STRINGS } from "../strings";
import type { PostableGroup, PrayerReminder } from "../types";
import PrayerReminderRow from "./PrayerReminderRow";

type Props = { reminders: PrayerReminder[]; groups: PostableGroup[] };

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// The admin page's section for prayer reminders: when each group gets "time to pray", every week, in
// church time. For someone with the "prayer.reminders" permission; the database refuses everyone else.
export default function PrayerReminderAdmin({ reminders, groups }: Props) {
  const refresh = useRefresh();
  const { t, language } = useLanguage(); // I18N
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  // Starts on today (at church): a reminder is most often set for the day it is thought of, and a list
  // that starts on Sunday made "add one for tonight" land four days away.
  const [weekday, setWeekday] = useState(() => churchWeekday(new Date()));
  const [sendAt, setSendAt] = useState("19:00");
  const showBanner = useBanner();
  const { pending, run } = usePending<"add">();

  // 1 January 2023 was a Sunday, so day 1 + n of that month is weekday n. Read in UTC so no timezone moves it.
  const weekdayName = (day: number) =>
    new Date(Date.UTC(2023, 0, 1 + day)).toLocaleDateString(LOCALES[language], { weekday: "long", timeZone: "UTC" });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Spelled out rather than `useSave`: "already exists" is a third outcome, neither saved nor failed.
    run("add", async () => {
      try {
        if ((await addReminder(groupId, weekday, sendAt)) === "exists") {
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
          <PrayerReminderRow
            key={reminder.id}
            reminder={reminder}
            groupName={groups.find((group) => group.id === reminder.group_id)?.name}
            when={`${weekdayName(reminder.weekday)} · ${reminder.send_at.slice(0, 5)}`}
          />
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-6">
        <Field label={t(STRINGS.groupField)}>
          <Select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t(STRINGS.dayField)}>
          <Select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {weekdayName(day)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t(STRINGS.timeField)}>
          <TextInput type="time" value={sendAt} onChange={(event) => setSendAt(event.target.value)} />
        </Field>
        <Button variant="quiet" pending={pending === "add"} disabled={!groupId || !sendAt}>
          {t(STRINGS.addReminder)}
        </Button>
      </form>
    </section>
  );
}
