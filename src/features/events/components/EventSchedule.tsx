"use client";

import { Pencil } from "lucide-react";
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
import { cardsOf, nextOfEach, scheduleOf } from "../occurrences";
import { STRINGS } from "../strings";
import type { Occurrence, ScheduledEvent, WeeklyCard, WeeklyMeeting } from "../types";
import { weeklyLineOf } from "../weekly";
import EventCard from "./EventCard";
import EventWeeklyCard from "./EventWeeklyCard";

type Props = {
  events: ScheduledEvent[]; // as the page loaded them
  weeklyCard: WeeklyCard | null; // null before schema.sql 3h is run: no first card
  meetings: WeeklyMeeting[]; // the groups' weekly meetings, for the first card
  canManage: boolean; // an admin: the Edit button, which opens the list of everything to edit
};

// The schedule (the user, 2026-10-21): first the weekly card, every weekly event and group meeting by weekday;
// then each one-time event under its day, soonest first, a day's events at one place sharing a card (`cardsOf`).
// It shows what the page loaded at once, then keeps itself fresh (`useFresh`).
export default function EventSchedule({ events: loaded, weeklyCard, meetings, canManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const events = useFresh(loaded, getSchedule);
  const dates = scheduleOf(events, language, new Date());
  // A weekly event at its next date that is on: a skipped week shows the week after, on the same weekday.
  const weekly = nextOfEach(dates.filter((date) => date.event.repeats_weekly && !date.canceled));
  const oneTime = dates.filter((date) => !date.event.repeats_weekly && (SWITCHES.canceledEvents || !date.canceled));
  const lines = [...weekly.map(weeklyLineOf), ...meetings.map((meeting) => ({ ...meeting, title: t(meeting.title) }))];

  const edit = canManage && (
    <div className="flex justify-end px-3 pt-2">
      <IconButton tone="filled" label={t(STRINGS.editSchedule)} onClick={() => router.replace("/events/manage", { transitionTypes: GO_FORWARD })}>
        <Pencil />
      </IconButton>
    </div>
  );

  if (!weeklyCard && oneTime.length === 0) {
    return (
      <div>
        {edit}
        <EmptyState message={t(STRINGS.emptyState)} />
      </div>
    );
  }

  return (
    <div>
      {edit}
      {weeklyCard && (
        <div className="px-3 pt-4">
          <EventWeeklyCard card={weeklyCard} lines={lines} />
        </div>
      )}
      {groupByDay(oneTime).map(([day, ofThatDay]) => (
        <section key={day}>
          <SectionHeading>{dayLabel(day, language, t)}</SectionHeading>
          <div className="flex flex-col gap-4 px-3">
            {cardsOf(ofThatDay).map((card) => (
              <EventCard key={card[0].event.id} occurrences={card} />
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
