"use client";

import { useEffect } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = {
  request: PrayerRequest;
  onAnswered: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClose: () => void;
};

// What an author can do with their own request: mark it answered, delete it, or change their mind.
export default function RequestOptions({ request, onAnswered, onDelete, onClose }: Props) {
  const { t } = useLanguage(); // I18N

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

  // Deleting cannot be undone, so it is asked twice. Marking as answered is not asked: it destroys nothing.
  function handleDelete() {
    if (window.confirm(t(STRINGS.confirmDelete))) run(onDelete);
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
        <p className="line-clamp-2 text-gray-500">{request.body}</p>

        {!request.answered_at && (
          <button onClick={() => run(onAnswered)} className="w-full rounded bg-green-600 p-3 text-lg text-white">
            ✓ {t(STRINGS.markAnswered)}
          </button>
        )}
        <button onClick={handleDelete} className="w-full rounded bg-red-600 p-3 text-lg text-white">
          {t(STRINGS.deleteRequest)}
        </button>
        <button onClick={onClose} className="w-full rounded border p-3 text-lg">
          {t(STRINGS.cancel)}
        </button>
      </div>
    </div>
  );
}
