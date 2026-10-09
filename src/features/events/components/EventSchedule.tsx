"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Language, Text } from "@/features/i18n/types"; // I18N
import { isoDate, toInstant } from "@/lib/churchTime";
import { useFresh } from "@/lib/useFresh";
import { getSchedule } from "../api";
import { formatLongDate } from "../formatting";
import { scheduleOf } from "../occurrences";
import { STRINGS } from "../strings";
import type { Occurrence, ScheduledEvent } from "../types";
import EventDetails from "./EventDetails";
import EventRow from "./EventRow";

type Props = { events: ScheduledEvent[] }; // as the page loaded them

// The schedule: every date in the next weeks, grouped by day, soonest first. Tapping one opens its details.
// It shows what the page loaded at once, then keeps itself fresh (`useFresh`).
export default function EventSchedule({ events: loaded }: Props) {
  const { t, language } = useLanguage(); // I18N
  const [open, setOpen] = useState<Occurrence | null>(null);
  const events = useFresh(loaded, getSchedule);
  const occurrences = scheduleOf(events, language, new Date());

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

// The dates under the church day each falls on, in the order they arrive (soonest first).
function groupByDay(occurrences: Occurrence[]): [string, Occurrence[]][] {
  const days = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
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
