"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES, type Text } from "@/features/i18n/types"; // I18N
import { addReminder, removeReminder } from "../api";
import { churchWeekday } from "../reminders";
import { STRINGS } from "../strings";
import type { PostableGroup, PrayerReminder } from "../types";

type Props = { reminders: PrayerReminder[]; groups: PostableGroup[] };

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// The admin page's section for prayer reminders: when each group gets "time to pray", every week.
// Times are church time. Shown only to someone with the "prayer.reminders" permission; the database
// refuses everyone else anyway.
export default function PrayerReminderAdmin({ reminders, groups }: Props) {
  const router = useRouter();
  const { t, language } = useLanguage(); // I18N
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  // Starts on today (at church): a reminder is most often set for the day it is thought of, and a list
  // that starts on Sunday made "add one for tonight" land four days away.
  const [weekday, setWeekday] = useState(() => churchWeekday(new Date()));
  const [sendAt, setSendAt] = useState("19:00");
  const [problem, setProblem] = useState<Text | null>(null); // what to tell the admin, when a change did not happen
  const [saving, setSaving] = useState(false); // one change at a time: a second tap waits for the first

  // 1 January 2023 was a Sunday, so day 1 + n of that month is weekday n. Read in UTC so no timezone moves it.
  const weekdayName = (day: number) =>
    new Date(Date.UTC(2023, 0, 1 + day)).toLocaleDateString(LOCALES[language], { weekday: "long", timeZone: "UTC" });

  // `change` answers with a reason when it did nothing for a reason worth naming; anything unexpected throws.
  async function save(change: () => Promise<Text | null>) {
    setProblem(null);
    setSaving(true);
    try {
      setProblem(await change());
      router.refresh(); // reload the page's server data: the list is what the database says
    } catch {
      setProblem(STRINGS.failed);
    }
    setSaving(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save(async () => ((await addReminder(groupId, weekday, sendAt)) === "exists" ? STRINGS.reminderExists : null));
  }

  const input = "rounded border p-2 text-lg";

  return (
    <section className="p-4">
      <h2 className="mb-2 border-b pb-1 text-lg font-semibold">{t(STRINGS.remindersHeading)}</h2>

      <ul className="space-y-2">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="flex items-center justify-between gap-2 text-lg">
            <span>
              {groups.find((group) => group.id === reminder.group_id)?.name} · {weekdayName(reminder.weekday)} ·{" "}
              {reminder.send_at.slice(0, 5)}
            </span>
            <button
              onClick={() => save(async () => (await removeReminder(reminder.id), null))}
              disabled={saving}
              className="rounded border px-3 py-1 text-red-600 disabled:opacity-50"
            >
              {t(STRINGS.removeReminder)}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-2">
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={`${input} min-w-0 flex-1`}>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))} className={input}>
          {WEEKDAYS.map((day) => (
            <option key={day} value={day}>
              {weekdayName(day)}
            </option>
          ))}
        </select>
        <input type="time" value={sendAt} onChange={(event) => setSendAt(event.target.value)} className={input} />
        <button disabled={saving || !groupId || !sendAt} className="w-full rounded bg-blue-500 p-3 text-lg text-white disabled:opacity-50">
          {t(STRINGS.addReminder)}
        </button>
      </form>
      {problem && (
        <p role="alert" className="mt-2 text-red-600">
          {t(problem)}
        </p>
      )}
    </section>
  );
}
