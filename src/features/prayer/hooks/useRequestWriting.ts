"use client";

import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useGoTo } from "@/lib/useGoTo";
import { createRequest, editRequest } from "../api";
import { STRINGS } from "../strings";
import type { NewPrayerRequest } from "../types";

// Saving a request from its own screen (new, or my own edited), then going back to the list, which reads
// itself again on arrival. After a failure the screen stays, with the words still there to resend.
export function useRequestWriting() {
  const goTo = useGoTo();
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  async function saveThenLeave(save: () => Promise<void>, done: Text) {
    try {
      await save();
      showBanner({ kind: "success", message: t(done) });
      // Awaited last: the button stays busy until the list is drawn, so a second tap cannot post twice.
      await goTo("/prayer");
    } catch (error) {
      console.error("saving a prayer request failed", error);
      showBanner({ kind: "error", message: t(STRINGS.failed) });
    }
  }

  return {
    post: (request: NewPrayerRequest) => saveThenLeave(() => createRequest(request), STRINGS.shared),
    edit: (requestId: string, body: string) => saveThenLeave(() => editRequest(requestId, body), COMMON.saved),
  };
}
