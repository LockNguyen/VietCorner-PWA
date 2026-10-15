"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { removeReminder } from "../api";
import { STRINGS } from "../strings";
import type { PrayerReminder } from "../types";

type Props = { reminder: PrayerReminder; when: string }; // when: "Wednesday · 19:00"

// One reminder, with the button that removes it.
// A row of its own, so removing one never blocks the reminders around it.
export default function PrayerReminderRow({ reminder, when }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"remove">();
  const says = { done: t(COMMON.removed), failed: t(STRINGS.failed) };

  return (
    <ListRow
      title={when}
      trailing={
        <Button
          variant="quiet"
          pending={pending === "remove"}
          onClick={() => save("remove", () => removeReminder(reminder.id), says)}
        >
          {t(STRINGS.removeReminder)}
        </Button>
      }
    />
  );
}
