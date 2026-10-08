"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { removeReminder } from "../api";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";

type Props = { reminder: PrayerReminder; label: string }; // label: "Bible Study · Wednesday · 19:00"

// One reminder, with the button that removes it.
// A row of its own, so removing one never blocks the reminders around it.
export default function PrayerReminderRow({ reminder, label }: Props) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [failed, setFailed] = useState(false);
  const { pending, run } = usePending<"remove">();

  function handleRemove() {
    return run("remove", async () => {
      setFailed(false);
      try {
        await removeReminder(reminder.id);
        router.refresh(); // reload the page's server data: the list is what the database says
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <li className="text-lg">
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <ActionButton pending={pending === "remove"} onClick={handleRemove} className="rounded border px-3 py-1 text-red-600">
          {t(STRINGS.removeReminder)}
        </ActionButton>
      </div>
      {failed && <p className="text-red-600">{t(STRINGS.failed)}</p>}
    </li>
  );
}
