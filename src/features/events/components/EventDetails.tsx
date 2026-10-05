"use client";

import { useEffect } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { Occurrence } from "../types";

type Props = { occurrence: Occurrence; onClose: () => void };

// Everything about one date: when it starts and ends, where, what it is about, and whether it repeats.
// A plain overlay rather than a route, because the schedule stays behind it and nothing is shareable yet.
export default function EventDetails({ occurrence, onClose }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, endsAt, canceled } = occurrence;

  // Escape closes it: a phone user taps outside, a desktop user reaches for the key.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-10 flex items-end bg-black/40" onClick={onClose}>
      {/* Stops a tap inside the panel from closing it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.text.title}
        className="w-full rounded-t-lg bg-white p-4"
        onClick={(click) => click.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">{event.text.title}</h2>

        {canceled && <p className="mt-1 text-red-600">{t(STRINGS.canceled)}</p>}

        <p className="mt-2 text-lg">
          {formatLongDate(startsAt, language)}
          {" · "}
          {formatTime(startsAt, language)}
          {endsAt && ` – ${formatTime(endsAt, language)}`}
        </p>

        {event.repeats_weekly && <p className="text-gray-500">{t(STRINGS.everyWeek)}</p>}

        {event.text.location && (
          <p className="mt-2">
            <span className="text-gray-500">{t(STRINGS.location)}: </span>
            {event.text.location}
          </p>
        )}

        {event.text.description && <p className="mt-2 whitespace-pre-wrap">{event.text.description}</p>}

        <button onClick={onClose} className="mt-4 w-full rounded bg-blue-500 p-3 text-lg text-white">
          {t(STRINGS.close)}
        </button>
      </div>
    </div>
  );
}
