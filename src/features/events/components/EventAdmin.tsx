"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useRefresh } from "@/lib/useRefresh";
import { cancelEvent, restoreDate, saveEvent, setReminder } from "../api";
import { STRINGS } from "../strings";
import type { EventGroup, ManagedEvent } from "../types";
import EventAdminRow from "./EventAdminRow";
import EventEditor from "./EventEditor";

type Props = { events: ManagedEvent[]; groups: EventGroup[] };

// The admin page's section for events: every upcoming event in every group, and the editor that adds,
// changes and cancels. Shown only to someone with the "events.manage" permission; the database refuses
// everyone else anyway.
export default function EventAdmin({ events, groups }: Props) {
  const refresh = useRefresh();
  const { t } = useLanguage(); // I18N
  // Which event the editor is open on, by id rather than by value: after a date is cancelled the list is
  // reloaded, and the open editor must show the reloaded event, not the copy it was opened with.
  const [openOn, setOpenOn] = useState<string | "new" | null>(null);
  const openEvent = events.find((event) => event.id === openOn);
  const eventId = openEvent?.id ?? ""; // the handlers that use it are only reachable with an event open

  // Every change ends the same way: reload the page's server data and wait for it, so the screen is what
  // the database says by the time the button that was tapped stops looking busy.
  // It answers whether the change happened; the part of the editor that asked shows its own "could not
  // save" next to the button that was tapped, and keeps the editor open with what was typed.
  async function change(action: () => Promise<void>, { thenClose }: { thenClose: boolean }): Promise<boolean> {
    try {
      await action();
      if (thenClose) setOpenOn(null);
      await refresh(); // until the new list is drawn, so the tapped button stays busy until it has changed
      return true;
    } catch {
      return false;
    }
  }

  return (
    <section className="p-4">
      <h2 className="mb-2 border-b pb-1 text-lg font-semibold">{t(STRINGS.adminHeading)}</h2>

      <button onClick={() => setOpenOn("new")} className="w-full rounded bg-blue-500 p-3 text-lg text-white">
        {t(STRINGS.newEvent)}
      </button>
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <EventAdminRow
            key={event.id}
            event={event}
            groupName={groups.find((group) => group.id === event.group_id)?.name}
            onEdit={() => setOpenOn(event.id)}
          />
        ))}
      </ul>

      {(openOn === "new" || openEvent) && (
        <EventEditor
          key={openOn} // a fresh form per event
          event={openEvent}
          groups={groups}
          onSave={(draft) => change(() => saveEvent(draft, openEvent?.id), { thenClose: true })}
          onCancelDate={(churchDate) => change(() => cancelEvent(eventId, churchDate), { thenClose: false })}
          onRestoreDate={(churchDate) => change(() => restoreDate(eventId, churchDate), { thenClose: false })}
          onSetReminder={(minutesBefore, on) => change(() => setReminder(eventId, minutesBefore, on), { thenClose: false })}
          onCancelForGood={() => change(() => cancelEvent(eventId), { thenClose: true })}
          onClose={() => setOpenOn(null)}
        />
      )}
    </section>
  );
}
