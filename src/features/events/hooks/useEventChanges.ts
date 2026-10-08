"use client";

import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useGoTo } from "@/lib/useGoTo";
import { useRefresh } from "@/lib/useRefresh";
import { cancelEvent, restoreDate, saveEvent, setReminder } from "../api";
import { STRINGS } from "../strings";
import type { EventDraft } from "../types";

// Every change the editor can make to one event (`eventId` undefined = a new one).
// Each resolves when the change is on screen, and says how it went in a banner.
export function useEventChanges(eventId: string | undefined, listHref: string) {
  const goTo = useGoTo();
  const refresh = useRefresh();
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N
  const id = eventId ?? ""; // everything but `save` is only offered for an event that exists

  // `leave`: the change ends the editing, so go back to the list. Reloading this screen instead would
  // find nothing to show once the event has been called off for good. After a failure the editor stays.
  async function change(action: () => Promise<void>, done: Text, leave = false) {
    try {
      await action();
      if (!leave) await refresh();
      showBanner({ kind: "success", message: t(done) });
      // Awaited last: the button stays busy until the list is drawn, so a second tap cannot save twice.
      if (leave) await goTo(listHref);
    } catch {
      showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
    }
  }

  return {
    save: (draft: EventDraft) => change(() => saveEvent(draft, eventId), COMMON.saved, true),
    cancelDate: (churchDate: string) => change(() => cancelEvent(id, churchDate), STRINGS.canceled),
    restoreDate: (churchDate: string) => change(() => restoreDate(id, churchDate), STRINGS.backOn),
    setReminder: (minutesBefore: number, on: boolean) => change(() => setReminder(id, minutesBefore, on), COMMON.saved),
    cancelForGood: () => change(() => cancelEvent(id), STRINGS.canceled, true),
  };
}
