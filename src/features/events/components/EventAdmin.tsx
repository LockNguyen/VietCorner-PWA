"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { cancelEvent, removeEvent, saveEvent } from "../api";
import { draftOf, emptyDraft } from "../draft";
import { STRINGS } from "../strings";
import type { EventGroup, ManagedEvent } from "../types";
import EventAdminRow from "./EventAdminRow";
import EventForm from "./EventForm";

type Props = { events: ManagedEvent[]; groups: EventGroup[] };

// The admin page's section for events: every upcoming event in every group, a form to add or change one,
// and the buttons that cancel or remove. Shown only to someone with the "events.manage" permission; the
// database refuses everyone else anyway.
export default function EventAdmin({ events, groups }: Props) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [editing, setEditing] = useState<ManagedEvent | "new" | null>(null); // what the form is open on
  const [failed, setFailed] = useState(false);

  // Every action ends the same way: reload the page's server data, so the list is what the database says.
  // After a failure the form stays open with its contents, and the error is shown above it.
  async function run(action: () => Promise<void>) {
    setFailed(false);
    try {
      await action();
      setEditing(null);
      router.refresh();
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className="p-4">
      <h2 className="mb-2 border-b pb-1 text-lg font-semibold">{t(STRINGS.adminHeading)}</h2>
      {failed && (
        <p role="alert" className="mb-2 text-red-600">
          {t(STRINGS.couldNotSave)}
        </p>
      )}

      {editing ? (
        <EventForm
          initial={editing === "new" ? emptyDraft() : draftOf(editing)}
          groups={groups}
          onSave={(draft) => run(() => saveEvent(draft, editing === "new" ? undefined : editing.id))}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          <button onClick={() => setEditing("new")} className="w-full rounded bg-blue-500 p-3 text-lg text-white">
            {t(STRINGS.newEvent)}
          </button>
          <ul className="mt-4 space-y-3">
            {events.map((event) => (
              <EventAdminRow
                key={event.id}
                event={event}
                groupName={groups.find((group) => group.id === event.group_id)?.name}
                onEdit={() => setEditing(event)}
                onCancelDate={(date) => run(() => cancelEvent(event.id, date))}
                onCancelAll={() => run(() => cancelEvent(event.id))}
                onRemove={() => run(() => removeEvent(event.id))}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
