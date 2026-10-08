"use client";

import Switch from "@/components/ui/Switch";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { REMINDER_LABELS } from "../strings";

type Props = { minutesBefore: number; on: boolean; onSet: (on: boolean) => Promise<void> };

// One reminder choice ("30 minutes before") as a switch, disabled while its change is being saved.
// A row of its own, so switching one never blocks the others.
export default function EventReminderChoice({ minutesBefore, on, onSet }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"set">();

  return (
    <Switch
      label={t(REMINDER_LABELS[minutesBefore])}
      checked={on}
      disabled={pending !== null}
      onChange={(change) => {
        const wanted = change.target.checked; // read now: the event object is reused once this handler returns
        run("set", () => onSet(wanted));
      }}
    />
  );
}
