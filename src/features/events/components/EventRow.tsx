"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { Occurrence } from "../types";

type Props = { occurrence: Occurrence; onOpen: () => void };

// One line in the schedule: the time, the title, and whether it is off. Everything else waits for the tap.
export default function EventRow({ occurrence, onOpen }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;

  return (
    <li>
      <button onClick={onOpen} className="w-full rounded border p-3 text-left text-lg">
        <span className="mr-2 text-gray-500">{time(startsAt, language)}</span>
        <span className={canceled ? "line-through" : ""}>{event.text.title}</span>
        {canceled && <span className="ml-2 text-red-600">({t(STRINGS.canceled)})</span>}
        {event.group_id && <span className="ml-2 text-sm text-gray-400">{t(STRINGS.groupOnly)}</span>}
      </button>
    </li>
  );
}

export function time(date: Date, language: string): string {
  return date.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: "numeric", minute: "2-digit" });
}
