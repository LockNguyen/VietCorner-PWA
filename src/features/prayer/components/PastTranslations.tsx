"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getPastTranslations } from "../api";
import { STRINGS } from "../strings";
import type { PrayerTranslation } from "../types";
import TranslationReviewRow from "./TranslationReviewRow";

type Props = { requests: PrayerTranslation[] }; // as the page loaded them

// Every approved translation still in the feed, newest first, each with the pencil and the circular arrow: for
// when members say a translation reads badly (the user, 2026-10-23). Reads itself again on every arrival.
export default function PastTranslations({ requests: loaded }: Props) {
  const { t } = useLanguage(); // I18N
  const requests = useFresh(loaded, getPastTranslations);
  if (requests.length === 0) return <EmptyState message={t(STRINGS.noPastTranslations)} />;

  return (
    <ul>
      {requests.map((request) => (
        <TranslationReviewRow key={request.id} request={request} />
      ))}
    </ul>
  );
}
