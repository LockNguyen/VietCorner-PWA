"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import IconButton from "@/components/ui/IconButton";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { wallTime } from "@/lib/churchTime";
import { GO_FORWARD } from "@/lib/slide";
import { formatLongDate, formatShortTime, formatWeekday } from "../formatting";
import { STRINGS } from "../strings";
import type { ManagedEvent, WeeklyCard } from "../types";

type Props = {
  card: WeeklyCard | null; // null before schema.sql 3h is run
  events: ManagedEvent[]; // soonest first (`managed_events()`)
};

// The admin's Edit list (the user, 2026-10-21): a + for a new event, the weekly card first, then the events under
// "Every week" and "One-time". Each row slides in its editor.
export default function EventManageList({ card, events }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();

  // "Chúa Nhật · 10:30a" for a weekly event, "Thứ 7, 25 tháng 10 · 9:00a" for a one-time one: its next date.
  function when(event: ManagedEvent): string | undefined {
    const next = event.upcoming[0];
    if (!next) return undefined; // a weekly event whose last week is past
    const at = new Date(next.startsAt);
    const day = event.repeats_weekly ? formatWeekday(at, language) : formatLongDate(at, language);
    return `${day} · ${formatShortTime(wallTime(at).slice(11))}`;
  }

  const rows = (weekly: boolean) =>
    events
      .filter((event) => event.repeats_weekly === weekly)
      .map((event) => (
        <ListRow
          key={event.id}
          title={(event.texts[language] ?? Object.values(event.texts)[0])?.title ?? ""}
          subtitle={when(event)}
          href={`/events/${event.id}/edit`}
        />
      ));

  return (
    <div className="flex flex-col pb-6">
      <div className="flex justify-end px-3 pt-2">
        <IconButton tone="filled" label={t(STRINGS.newEvent)} onClick={() => router.replace("/events/new", { transitionTypes: GO_FORWARD })}>
          <Plus />
        </IconButton>
      </div>
      {card && (
        <ul>
          <ListRow title={t({ vi: card.title, en: card.title_en ?? "" })} subtitle={t(STRINGS.firstCard)} href="/events/weekly/edit" />
        </ul>
      )}
      <SectionHeading>{t(STRINGS.everyWeek)}</SectionHeading>
      <ul>{rows(true)}</ul>
      <SectionHeading>{t(STRINGS.oneTime)}</SectionHeading>
      <ul>{rows(false)}</ul>
    </div>
  );
}
