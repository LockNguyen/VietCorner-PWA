"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";
import EventDateRow from "./EventDateRow";

type Props = {
  event: ManagedEvent;
  onCancelDate: (churchDate: string) => Promise<void>;
  onRestoreDate: (churchDate: string) => Promise<void>;
};

// An event's next dates. On a weekly event each date can be called off by itself, and a date that was
// called off shows Undo in the same place. A one-off event has one date and no button here: calling that
// date off is calling the event off, which is the red button below this list.
export default function EventDates({ event, onCancelDate, onRestoreDate }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <h3 className="mb-1 font-semibold">{t(STRINGS.nextDates)}</h3>
      <ul className="space-y-2">
        {event.upcoming.map((date) => (
          <EventDateRow
            key={date.churchDate}
            date={date}
            canChange={event.repeats_weekly}
            onCancel={() => onCancelDate(date.churchDate)}
            onRestore={() => onRestoreDate(date.churchDate)}
          />
        ))}
      </ul>
    </section>
  );
}
