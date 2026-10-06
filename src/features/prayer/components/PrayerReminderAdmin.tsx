"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { addReminder, removeReminder } from "../api";
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
  const [weekday, setWeekday] = useState(0);
  const [sendAt, setSendAt] = useState("19:00");
  const [failed, setFailed] = useState(false);

  // 1 January 2023 was a Sunday, so day 1 + n of that month is weekday n. Read in UTC so no timezone moves it.
  const weekdayName = (day: number) =>
    new Date(Date.UTC(2023, 0, 1 + day)).toLocaleDateString(LOCALES[language], { weekday: "long", timeZone: "UTC" });

  async function save(change: () => Promise<void>) {
    setFailed(false);
    try {
      await change();
      router.refresh(); // reload the page's server data: the list is what the database says
    } catch {
      setFailed(true); // most often: that group already has this exact reminder
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save(() => addReminder(groupId, weekday, sendAt));
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
            <button onClick={() => save(() => removeReminder(reminder.id))} className="rounded border px-3 py-1 text-red-600">
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
        <button disabled={!groupId || !sendAt} className="w-full rounded bg-blue-500 p-3 text-lg text-white disabled:opacity-50">
          {t(STRINGS.addReminder)}
        </button>
      </form>
      {failed && <p className="mt-2 text-red-600">{t(STRINGS.failed)}</p>}
    </section>
  );
}
