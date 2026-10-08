"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import { REMINDER_CHOICES, type ManagedEvent } from "../types";
import EventReminderChoice from "./EventReminderChoice";

type Props = { event: ManagedEvent; onSet: (minutesBefore: number, on: boolean) => Promise<void> };

// Which reminders members get before each date of this event. A switch saves at once; the scheduler does
// the sending (the push README), to the same people a cancellation would reach.
export default function EventReminders({ event, onSet }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading>{t(STRINGS.remindersHeading)}</SectionHeading>
      <div className="flex flex-col px-3">
        {REMINDER_CHOICES.map((minutesBefore) => (
          <EventReminderChoice
            key={minutesBefore}
            minutesBefore={minutesBefore}
            on={event.reminderMinutes.includes(minutesBefore)}
            onSet={(on) => onSet(minutesBefore, on)}
          />
        ))}
      </div>
    </section>
  );
}
