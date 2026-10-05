"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { isoDate } from "../occurrences";
import { STRINGS } from "../strings";
import type { Occurrence } from "../types";
import EventDetails from "./EventDetails";
import EventRow from "./EventRow";

type Props = { occurrences: SerializedOccurrence[] };

// Dates survive the server → client hop as strings, so they are revived here.
export type SerializedOccurrence = Omit<Occurrence, "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string | null;
};

// The schedule: every date in the next weeks, grouped by day, newest last. Tapping one opens its details.
export default function EventSchedule({ occurrences }: Props) {
  const { t, language } = useLanguage(); // I18N
  const [open, setOpen] = useState<Occurrence | null>(null);

  if (occurrences.length === 0) {
    return <p className="p-4 text-center text-gray-500">{t(STRINGS.emptyState)}</p>;
  }

  const days = groupByDay(occurrences);

  return (
    <div className="p-4">
      {days.map(([day, ofThatDay]) => (
        <section key={day} className="mb-6">
          <h2 className="mb-2 border-b pb-1 text-lg font-semibold">{dayLabel(day, language, t)}</h2>
          <ul className="space-y-2">
            {ofThatDay.map((occurrence) => (
              <EventRow
                key={`${occurrence.event.id}-${occurrence.startsAt}`}
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
function dayLabel(day: string, language: string, t: (text: { en: string; vi: string }) => string): string {
  const today = isoDate(new Date());
  const tomorrow = isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  if (day === today) return t(STRINGS.today);
  if (day === tomorrow) return t(STRINGS.tomorrow);

  return new Date(`${day}T12:00:00`).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
