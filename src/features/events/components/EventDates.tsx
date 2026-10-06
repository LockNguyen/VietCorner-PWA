"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";

type Props = {
  event: ManagedEvent;
  onCancelDate: (churchDate: string) => void;
  onRestoreDate: (churchDate: string) => void;
};

// An event's next dates. On a weekly event each date can be called off by itself, and a date that was
// called off shows Undo in the same place. A one-off event has one date and no button here: calling that
// date off is calling the event off, which is the red button below this list.
export default function EventDates({ event, onCancelDate, onRestoreDate }: Props) {
  const { t, language } = useLanguage(); // I18N

  return (
    <section>
      <h3 className="mb-1 font-semibold">{t(STRINGS.nextDates)}</h3>
      <ul className="space-y-2">
        {event.upcoming.map((date) => (
          <li key={date.churchDate} className="flex items-center justify-between gap-2">
            <span className={`text-lg ${date.canceled ? "text-gray-400 line-through" : ""}`}>
              {formatLongDate(new Date(date.startsAt), language)}, {formatTime(new Date(date.startsAt), language)}
            </span>
            {event.repeats_weekly &&
              (date.canceled ? (
                <button onClick={() => onRestoreDate(date.churchDate)} className="rounded border px-4 py-2 text-lg">
                  {t(STRINGS.undoCancel)}
                </button>
              ) : (
                <button
                  onClick={() => onCancelDate(date.churchDate)}
                  className="rounded border border-red-600 px-4 py-2 text-lg text-red-600"
                >
                  {t(STRINGS.cancelThisDate)}
                </button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
