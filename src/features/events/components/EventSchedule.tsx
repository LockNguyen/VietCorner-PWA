"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Language, Text } from "@/features/i18n/types"; // I18N
import { isoDate, toInstant } from "@/lib/churchTime";
import { formatLongDate } from "../formatting";
import { STRINGS } from "../strings";
import type { Occurrence, SerializedOccurrence } from "../types";
import EventDetails from "./EventDetails";
import EventRow from "./EventRow";

type Props = { occurrences: SerializedOccurrence[] };

// The schedule: every date in the next weeks, grouped by day, soonest first. Tapping one opens its details.
export default function EventSchedule({ occurrences }: Props) {
  const { t, language } = useLanguage(); // I18N
  const [open, setOpen] = useState<Occurrence | null>(null);

  if (occurrences.length === 0) return <EmptyState message={t(STRINGS.emptyState)} />;

  return (
    <div>
      {groupByDay(occurrences).map(([day, ofThatDay]) => (
        <section key={day}>
          <SectionHeading>{dayLabel(day, language, t)}</SectionHeading>
          <ul>
            {ofThatDay.map((occurrence) => (
              <EventRow
                key={`${occurrence.event.id}-${occurrence.startsAt.toISOString()}`}
                occurrence={occurrence}
                onOpen={() => setOpen(occurrence)}
              />
            ))}
          </ul>
        </section>
      ))}

      {open && <EventDetails occurrence={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// Dates arrive as strings over the wire; they become Dates here, grouped under the day they fall on.
function groupByDay(occurrences: SerializedOccurrence[]): [string, Occurrence[]][] {
  const days = new Map<string, Occurrence[]>();
  for (const serialized of occurrences) {
    const occurrence: Occurrence = {
      ...serialized,
      startsAt: new Date(serialized.startsAt),
      endsAt: serialized.endsAt ? new Date(serialized.endsAt) : null,
    };
    const day = isoDate(occurrence.startsAt);
    days.set(day, [...(days.get(day) ?? []), occurrence]);
  }
  return [...days.entries()];
}

// "Today" and "Tomorrow" read faster than a date for the two days that matter most.
function dayLabel(day: string, language: Language, t: (text: Text) => string): string {
  if (day === isoDate(new Date())) return t(STRINGS.today);
  if (day === isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000))) return t(STRINGS.tomorrow);

  return formatLongDate(toInstant(`${day}T12:00`), language);
}
