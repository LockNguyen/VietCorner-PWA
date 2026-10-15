"use client";

import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { COMMON } from "@/features/i18n/common"; // I18N
import { SWITCHES } from "@/lib/switches";
import { useConfirmTap } from "@/lib/useConfirmTap";
import { usePending } from "@/lib/usePending";
import { draftOf, emptyDraft } from "../draft";
import { useEventChanges } from "../hooks/useEventChanges";
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";
import EventDates from "./EventDates";
import EventForm from "./EventForm";
import EventReminders from "./EventReminders";
import EventThumbnail from "./EventThumbnail";

type Props = {
  event: ManagedEvent | undefined; // undefined = a new event
  listHref: string; // where saving, or calling the event off for good, leads back to
};

// The editor for one event, a screen of its own. For an event that exists: its picture on top, its fields, its
// reminders and next dates, and last a small red line that calls the whole event off for good (tapped twice).
// A weekly event is one row, so whatever is changed here, picture included, applies to every week.
export default function EventEditor({ event, listHref }: Props) {
  const { t } = useLanguage(); // I18N
  const changes = useEventChanges(event?.id, listHref);
  const { pending, run } = usePending<"cancelForGood">();
  const { armed, tap } = useConfirmTap(() => run("cancelForGood", changes.cancelForGood));

  return (
    <div className="flex flex-col gap-6 pb-6">
      {event && <EventThumbnail event={event} onSet={changes.setThumbnail} onRemove={changes.removeThumbnail} />}
      <EventForm initial={event ? draftOf(event) : emptyDraft()} onSave={changes.save} />

      {event && (
        <>
          {SWITCHES.eventReminders && <EventReminders event={event} onSet={changes.setReminder} />}
          <EventDates event={event} onCancelDate={changes.cancelDate} onRestoreDate={changes.restoreDate} />
          {/* No "are you sure?" (decided: fewer taps), and no undo: members are told, the event stays on
              their schedule struck through for a week, then it is gone. The row is kept in the database. */}
          <div className="flex flex-col px-3">
            <Button variant="dangerText" pending={pending === "cancelForGood"} onClick={tap}>
              {armed ? t(COMMON.tapAgain) : t(STRINGS.cancelForGood)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
