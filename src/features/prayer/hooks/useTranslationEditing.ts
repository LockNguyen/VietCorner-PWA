"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Language } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { GO_BACK } from "@/lib/slide";
import { useGoTo } from "@/lib/useGoTo";
import { reviewTranslation } from "../api";
import { STRINGS } from "../strings";
import type { PrayerTranslation } from "../types";

// The translation's edit screen: Submit approves the corrected words and goes back to the list it was opened from
// (`backHref`), which reads itself again on arrival; Cancel goes back with nothing changed. After a failure the screen stays, with
// the words still there to send again.
export function useTranslationEditing(backHref: string) {
  const goTo = useGoTo();
  const router = useRouter();
  const showBanner = useBanner();
  const { t } = useLanguage(); // I18N

  async function submit(request: PrayerTranslation, translation: string, language: Language) {
    try {
      await reviewTranslation(request, translation, language);
      showBanner({ kind: "success", message: t(STRINGS.translationApproved) });
      // Awaited last: the button stays busy until the list is drawn, so a second tap cannot send twice.
      await goTo(backHref);
    } catch (error) {
      console.error("approving a translation failed", error);
      showBanner({ kind: "error", message: t(STRINGS.failed) });
    }
  }

  return { submit, cancel: () => router.replace(backHref, { transitionTypes: GO_BACK }) };
}
