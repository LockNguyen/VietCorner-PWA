"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";

type Props = {
  event: ManagedEvent;
  groupName: string | undefined; // undefined = church-wide
  onEdit: () => void;
};

// One event in the admin list: what it is, who it is for, when it is next, and the one button that opens
// the editor. Everything that changes the event happens in there.
export default function EventAdminRow({ event, groupName, onEdit }: Props) {
  const { t, language } = useLanguage(); // I18N
  // The admin's own language first; an event written in one language only still has a name.
  const title = (event.texts[language] ?? event.texts.en ?? event.texts.vi)?.title ?? t(STRINGS.untitled);
  const next = event.upcoming.find((date) => !date.canceled);

  return (
    <li className="rounded border p-3">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-gray-500">
        {groupName ?? t(STRINGS.churchWide)}
        {event.repeats_weekly && ` · ${t(STRINGS.everyWeek)}`}
        {next && ` · ${formatLongDate(new Date(next.startsAt), language)}, ${formatTime(new Date(next.startsAt), language)}`}
      </p>
      <button onClick={onEdit} className="mt-2 w-full rounded border p-2 text-lg">
        {t(STRINGS.editEvent)}
      </button>
    </li>
  );
}
