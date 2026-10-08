"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { removeReminder } from "../api";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";

type Props = { reminder: PrayerReminder; label: string }; // label: "Bible Study · Wednesday · 19:00"

// One reminder, with the button that removes it.
// A row of its own, so removing one never blocks the reminders around it.
export default function PrayerReminderRow({ reminder, label }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"remove">();
  const says = { done: t(STRINGS.removed), failed: t(STRINGS.failed) };

  return (
    <li className="flex items-center justify-between gap-2 text-lg">
      <span>{label}</span>
      <ActionButton
        pending={pending === "remove"}
        onClick={() => save("remove", () => removeReminder(reminder.id), says)}
        className="rounded border px-3 py-1 text-red-600"
      >
        {t(STRINGS.removeReminder)}
      </ActionButton>
    </li>
  );
}
