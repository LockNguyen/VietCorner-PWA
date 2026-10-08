"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";
import EventDateRow from "./EventDateRow";

type Props = {
  event: ManagedEvent;
  onCancelDate: (churchDate: string) => Promise<void>;
  onRestoreDate: (churchDate: string) => Promise<void>;
};

// An event's next dates. A weekly event's dates are called off one by one, with Undo in the same place.
// A one-off event has no button here: calling its date off is calling the event off, the red button below.
export default function EventDates({ event, onCancelDate, onRestoreDate }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading>{t(STRINGS.nextDates)}</SectionHeading>
      <ul>
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
