"use client";

import { useEffect } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { draftOf, emptyDraft } from "../draft";
import { STRINGS } from "../strings";
import type { EventDraft, EventGroup, ManagedEvent } from "../types";
import EventDates from "./EventDates";
import EventForm from "./EventForm";
import EventReminders from "./EventReminders";

type Props = {
  event: ManagedEvent | undefined; // undefined = a new event
  groups: EventGroup[];
  failed: boolean;
  onSave: (draft: EventDraft) => void;
  onCancelDate: (churchDate: string) => void;
  onRestoreDate: (churchDate: string) => void;
  onSetReminder: (minutesBefore: number, on: boolean) => void;
  onCancelForGood: () => void;
  onClose: () => void;
};

// The editor for one event, in a panel over the admin page: its fields, then (for an event that already
// exists) its reminders, its next dates with Cancel or Undo on each, and last the red button that calls
// the whole event off for good. A new event has only the fields: save it first, then open it again.
export default function EventEditor(props: Props) {
  const { event, groups, failed, onSave, onCancelDate, onRestoreDate, onSetReminder, onCancelForGood, onClose } = props;
  const { t } = useLanguage(); // I18N

  // Escape closes it: a phone user taps outside, a desktop user reaches for the key.
  useEffect(() => {
    function onKey(keyboard: KeyboardEvent) {
      if (keyboard.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-10 flex items-end bg-black/40" onClick={onClose}>
      {/* Stops a tap inside the panel from closing it. Scrolls, because the form is taller than a phone. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(event ? STRINGS.editEvent : STRINGS.newEvent)}
        className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-lg bg-white p-4"
        onClick={(click) => click.stopPropagation()}
      >
        {failed && (
          <p role="alert" className="text-red-600">
            {t(STRINGS.couldNotSave)}
          </p>
        )}

        <EventForm initial={event ? draftOf(event) : emptyDraft()} groups={groups} onSave={onSave} onCancel={onClose} />

        {event && (
          <>
            <EventReminders event={event} onSet={onSetReminder} />
            <EventDates event={event} onCancelDate={onCancelDate} onRestoreDate={onRestoreDate} />
            {/* No "are you sure?" (decided: fewer taps), and no undo: members are told, the event stays on
                their schedule struck through for a week, then it is gone. The row is kept in the database. */}
            <button onClick={onCancelForGood} className="w-full rounded bg-red-600 p-3 text-lg text-white">
              {t(STRINGS.cancelForGood)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
