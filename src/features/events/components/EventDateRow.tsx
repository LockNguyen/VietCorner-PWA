"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
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
  const { pending, run } = usePending<"change">();
  const startsAt = new Date(date.startsAt);

  return (
    <ListRow
      title={`${formatLongDate(startsAt, language)}, ${formatTime(startsAt, language)}`}
      tone={date.canceled ? "off" : "normal"}
      trailing={
        canChange && (
          <Button variant="quiet" pending={pending === "change"} onClick={() => run("change", date.canceled ? onRestore : onCancel)}>
            {t(date.canceled ? STRINGS.undoCancel : STRINGS.cancelThisDate)}
          </Button>
        )
      }
    />
  );
}
