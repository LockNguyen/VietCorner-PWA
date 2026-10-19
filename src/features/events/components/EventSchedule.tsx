"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { GO_FORWARD } from "@/lib/slide";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Language, Text } from "@/features/i18n/types"; // I18N
import { isoDate, toInstant } from "@/lib/churchTime";
import { SWITCHES } from "@/lib/switches";
import { useFresh } from "@/lib/useFresh";
import { getSchedule } from "../api";
import { formatLongDate } from "../formatting";
import { nextOfEach, scheduleOf } from "../occurrences";
import { STRINGS } from "../strings";
import type { Occurrence, ScheduledEvent } from "../types";
import EventCard from "./EventCard";

type Props = {
  events: ScheduledEvent[]; // as the page loaded them
  canManage: boolean; // an admin: a + for a new event
};

// The schedule: each event once, at its next date (a weekly one never shows a second week), grouped by day,
// soonest first. Tapping one opens its own page. It shows what the page loaded at once, then keeps itself
// fresh (`useFresh`).
export default function EventSchedule({ events: loaded, canManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const events = useFresh(loaded, getSchedule);
  const occurrences = nextOfEach(
    scheduleOf(events, language, new Date()).filter((date) => SWITCHES.canceledEvents || !date.canceled),
  );

  const add = canManage && (
    <div className="flex justify-end px-3 pt-2">
      <IconButton tone="filled" label={t(STRINGS.newEvent)} onClick={() => router.push("/events/new", { transitionTypes: GO_FORWARD })}>
        <Plus />
      </IconButton>
    </div>
  );

  if (occurrences.length === 0) {
    return (
      <div>
        {add}
        <EmptyState message={t(STRINGS.emptyState)} />
      </div>
    );
  }

  return (
    <div>
      {add}
      {groupByDay(occurrences).map(([day, ofThatDay]) => (
        <section key={day}>
          <SectionHeading>{dayLabel(day, language, t)}</SectionHeading>
          <div className="flex flex-col gap-4 px-3">
            {ofThatDay.map((occurrence) => (
              <EventCard key={occurrence.event.id} occurrence={occurrence} />
            ))}
          </div>
        </section>
      ))}

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
