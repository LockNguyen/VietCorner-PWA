"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { REMINDER_LABELS, STRINGS } from "../strings";

type Props = { minutesBefore: number; on: boolean; onSet: (on: boolean) => Promise<boolean> };

// One reminder choice ("30 minutes before") as a tick box. It is not a button, so it has no turning
// circle: while its change is being saved the box is disabled, and it shows the saved state when done.
// A row of its own, so ticking one never blocks the others.
export default function EventReminderChoice({ minutesBefore, on, onSet }: Props) {
  const { t } = useLanguage(); // I18N
  const [failed, setFailed] = useState(false);
  const { pending, run } = usePending<"set">();

  return (
    <label className="flex items-center gap-2 py-1 text-lg">
      <input
        type="checkbox"
        checked={on}
        disabled={pending !== null}
        onChange={(change) => {
          const wanted = change.target.checked; // read now: the event object is reused after this handler returns
          run("set", async () => setFailed(!(await onSet(wanted))));
        }}
        className="h-5 w-5"
      />
      {t(REMINDER_LABELS[minutesBefore])}
      {failed && <span className="text-red-600">{t(STRINGS.couldNotSave)}</span>}
    </label>
  );
}
