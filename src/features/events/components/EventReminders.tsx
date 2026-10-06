"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { REMINDER_LABELS, STRINGS } from "../strings";
import { REMINDER_CHOICES, type ManagedEvent } from "../types";

type Props = { event: ManagedEvent; onSet: (minutesBefore: number, on: boolean) => void };

// Which reminders members get before each date of this event. A tick saves at once; the scheduler does the
// sending (the push README), to the same people a cancellation would reach.
export default function EventReminders({ event, onSet }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <h3 className="mb-1 font-semibold">{t(STRINGS.remindersHeading)}</h3>
      {REMINDER_CHOICES.map((minutesBefore) => (
        <label key={minutesBefore} className="flex items-center gap-2 py-1 text-lg">
          <input
            type="checkbox"
            checked={event.reminderMinutes.includes(minutesBefore)}
            onChange={(change) => onSet(minutesBefore, change.target.checked)}
            className="h-5 w-5"
          />
          {t(REMINDER_LABELS[minutesBefore])}
        </label>
      ))}
    </section>
  );
}
