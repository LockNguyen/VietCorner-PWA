"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";

type Props = {
  event: ManagedEvent;
  groupName: string | undefined; // undefined = church-wide
  onEdit: () => void;
  onCancelDate: (churchDate: string) => void;
  onCancelAll: () => void;
  onRemove: () => void;
};

// One event as its manager sees it: what and for whom, its next dates, and what can be done to it.
// Cancelling tells members and keeps the event on their schedule, struck through. Removing takes it away
// silently. Neither asks "are you sure?" (decided: fewer taps).
export default function EventAdminRow({ event, groupName, onEdit, onCancelDate, onCancelAll, onRemove }: Props) {
  const { t, language } = useLanguage(); // I18N
  // The admin's own language first; an event written in one language only still has a name.
  const title = (event.texts[language] ?? event.texts.en ?? event.texts.vi)?.title ?? t(STRINGS.untitled);
  const offForGood = Boolean(event.canceled_at);

  return (
    <li className="rounded border p-3">
      <p className={`text-lg font-semibold ${offForGood ? "line-through" : ""}`}>{title}</p>
      <p className="text-sm text-gray-500">
        {groupName ?? t(STRINGS.churchWide)}
        {event.repeats_weekly && ` · ${t(STRINGS.everyWeek)}`}
        {offForGood && ` · ${t(STRINGS.canceled)}`}
      </p>

      <ul className="mt-2 space-y-1">
        {event.upcoming.map((date) => (
          <li key={date.churchDate} className="flex items-center justify-between gap-2">
            <span className={date.canceled ? "text-gray-400 line-through" : ""}>
              {formatLongDate(new Date(date.startsAt), language)}, {formatTime(new Date(date.startsAt), language)}
            </span>
            {/* One week can be called off only where there is more than one: for a one-off event, that is "cancel". */}
            {event.repeats_weekly && !date.canceled && (
              <button onClick={() => onCancelDate(date.churchDate)} className="rounded border px-3 py-1 text-red-600">
                {t(STRINGS.cancelThisDate)}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <button onClick={onEdit} className="flex-1 rounded border p-2 text-lg">
          {t(STRINGS.edit)}
        </button>
        {!offForGood && (
          <button onClick={onCancelAll} className="flex-1 rounded border border-red-600 p-2 text-lg text-red-600">
            {t(event.repeats_weekly ? STRINGS.cancelEveryWeek : STRINGS.cancelEvent)}
          </button>
        )}
        <button onClick={onRemove} className="flex-1 rounded bg-red-600 p-2 text-lg text-white">
          {t(STRINGS.remove)}
        </button>
      </div>
    </li>
  );
}
