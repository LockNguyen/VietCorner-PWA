"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";
import RequestEditor from "./RequestEditor";

type Props = {
  request: PrayerRequest;
  onAnswered: () => Promise<boolean>;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClose: () => void;
};

// What an author can do with their own request: mark it answered, edit it, delete it, or change their mind.
// One tap each, with no "are you sure?": the dialog itself is the second step after the X.
export default function RequestOptions({ request, onAnswered, onEdit, onDelete, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [editing, setEditing] = useState(false);

  // Escape closes it: a phone user taps outside, a desktop user reaches for the key.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The dialog closes either way: on failure the board shows the error, behind where this was.
  async function run(action: () => Promise<boolean>) {
    await action();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end bg-black/40" onClick={onClose}>
      {/* Stops a tap inside the panel from closing it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(STRINGS.manage)}
        className="w-full space-y-3 rounded-t-lg bg-white p-4"
        onClick={(click) => click.stopPropagation()}
      >
        {editing ? (
          <RequestEditor body={request.body} onSave={(body) => run(() => onEdit(body))} onCancel={onClose} />
        ) : (
          <>
            <p className="line-clamp-2 text-gray-500">{request.body}</p>
            <button onClick={() => run(onAnswered)} className="w-full rounded bg-green-600 p-3 text-lg text-white">
              ✓ {t(STRINGS.markAnswered)}
            </button>
            <button onClick={() => setEditing(true)} className="w-full rounded bg-blue-500 p-3 text-lg text-white">
              {t(STRINGS.editRequest)}
            </button>
            <button onClick={() => run(onDelete)} className="w-full rounded bg-red-600 p-3 text-lg text-white">
              {t(STRINGS.deleteRequest)}
            </button>
            <button onClick={onClose} className="w-full rounded border p-3 text-lg">
              {t(STRINGS.cancel)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
