"use client";

import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Language } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { retryTranslation, reviewTranslation } from "../api";
import { STRINGS } from "../strings";
import type { PrayerTranslation } from "../types";

// A reviewer's two actions on one row: Approve, and Retry. Spelled out rather than `useSave`: Retry has a third
// outcome, "busy", which is neither done nor an error (the user, 2026-10-23: so a busy AI is not mistaken for a bug).
export function useTranslationReview() {
  const { pending, run } = usePending<"approve" | "retry">();
  const refresh = useRefresh();
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  function approve(request: PrayerTranslation, translation: string, language: Language) {
    return run("approve", async () => {
      try {
        await reviewTranslation(request, translation, language);
        await refresh();
        showBanner({ kind: "success", message: t(STRINGS.translationApproved) });
      } catch (error) {
        console.error("approving a translation failed", error); // the banner is for the person, this for whoever debugs
        showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
      }
    });
  }

  function retry(request: PrayerTranslation) {
    return run("retry", async () => {
      try {
        const result = await retryTranslation(request.id);
        await refresh(); // either way it is now on the waiting list
        showBanner(
          result === "busy"
            ? { kind: "error", message: t(STRINGS.translationBusy) }
            : { kind: "success", message: t(STRINGS.translatedAgain) },
        );
      } catch (error) {
        console.error("retrying a translation failed", error);
        showBanner({ kind: "error", message: t(STRINGS.retryFailed) });
      }
    });
  }

  return { pending, approve, retry };
}
