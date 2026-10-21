"use client";

import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useGoTo } from "@/lib/useGoTo";
import { saveWeeklyCard } from "../api";
import type { WeeklyCard } from "../types";

// Saving the weekly card: the call, then back to the Edit list with a banner. After a failure the editor stays.
// Resolves once the list is drawn, so the button stays busy and a second tap cannot save twice.
export function useWeeklyCardSave(listHref: string) {
  const goTo = useGoTo();
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  return async function save(card: WeeklyCard) {
    try {
      await saveWeeklyCard(card);
      showBanner({ kind: "success", message: t(COMMON.saved) });
      await goTo(listHref);
    } catch (error) {
      console.error("saving the weekly card failed", error);
      showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
    }
  };
}
