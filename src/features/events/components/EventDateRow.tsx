"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { UpcomingDate } from "../types";

type Props = {
  date: UpcomingDate;
  canChange: boolean; // false for a one-off event: its only date is called off with the event itself
  onCancel: () => Promise<void>;
  onRestore: () => Promise<void>;
};

// One date of an event: Cancel while it is on, Undo once it is off.
// A row of its own, so calling one date off never blocks the dates around it.
export default function EventDateRow({ date, canChange, onCancel, onRestore }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { pending, run } = usePending<"cancel" | "restore">();
  const startsAt = new Date(date.startsAt);

  return (
    <li className="flex items-center justify-between gap-2">
      <span className={`text-lg ${date.canceled ? "text-gray-400 line-through" : ""}`}>
        {formatLongDate(startsAt, language)}, {formatTime(startsAt, language)}
      </span>
      {canChange &&
        (date.canceled ? (
          <ActionButton
            pending={pending === "restore"}
            onClick={() => run("restore", onRestore)}
            className="rounded border px-4 py-2 text-lg"
          >
            {t(STRINGS.undoCancel)}
          </ActionButton>
        ) : (
          <ActionButton
            pending={pending === "cancel"}
            onClick={() => run("cancel", onCancel)}
            className="rounded border border-red-600 px-4 py-2 text-lg text-red-600"
          >
            {t(STRINGS.cancelThisDate)}
          </ActionButton>
        ))}
    </li>
  );
}
