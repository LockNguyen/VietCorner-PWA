"use client";

import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { draftOf, emptyDraft } from "../draft";
import { useEventChanges } from "../hooks/useEventChanges";
import { STRINGS } from "../strings";
import type { EventGroup, ManagedEvent } from "../types";
import EventDates from "./EventDates";
import EventForm from "./EventForm";
import EventReminders from "./EventReminders";

type Props = {
  event: ManagedEvent | undefined; // undefined = a new event
  groups: EventGroup[];
  listHref: string; // where saving, or calling the event off for good, leads back to
};

// The editor for one event, a screen of its own: its fields, then (for an event that already exists) its
// reminders, its next dates, and last the red button that calls the whole event off for good.
export default function EventEditor({ event, groups, listHref }: Props) {
  const { t } = useLanguage(); // I18N
  const changes = useEventChanges(event?.id, listHref);
  const { pending, run } = usePending<"cancelForGood">();

  return (
    <div className="flex flex-col gap-6">
      <EventForm initial={event ? draftOf(event) : emptyDraft()} groups={groups} onSave={changes.save} />

      {event && (
        <>
          <EventReminders event={event} onSet={changes.setReminder} />
          <EventDates event={event} onCancelDate={changes.cancelDate} onRestoreDate={changes.restoreDate} />
          {/* No "are you sure?" (decided: fewer taps), and no undo: members are told, the event stays on
              their schedule struck through for a week, then it is gone. The row is kept in the database. */}
          <div className="flex flex-col px-3">
            <Button variant="danger" pending={pending === "cancelForGood"} onClick={() => run("cancelForGood", changes.cancelForGood)}>
              {t(STRINGS.cancelForGood)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
