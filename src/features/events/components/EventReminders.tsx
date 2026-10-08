"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import { REMINDER_CHOICES, type ManagedEvent } from "../types";
import EventReminderChoice from "./EventReminderChoice";

type Props = { event: ManagedEvent; onSet: (minutesBefore: number, on: boolean) => Promise<boolean> };

// Which reminders members get before each date of this event. A tick saves at once; the scheduler does the
// sending (the push README), to the same people a cancellation would reach.
export default function EventReminders({ event, onSet }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <h3 className="mb-1 font-semibold">{t(STRINGS.remindersHeading)}</h3>
      {REMINDER_CHOICES.map((minutesBefore) => (
        <EventReminderChoice
          key={minutesBefore}
          minutesBefore={minutesBefore}
          on={event.reminderMinutes.includes(minutesBefore)}
          onSet={(on) => onSet(minutesBefore, on)}
        />
      ))}
    </section>
  );
}
