"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getTranslationsToReview } from "../api";
import { STRINGS } from "../strings";
import type { PrayerTranslation } from "../types";
import TranslationReviewRow from "./TranslationReviewRow";

type Props = { requests: PrayerTranslation[] }; // the waiting ones, as the page loaded them

// The Admin tab's translations: first a row to the past (approved) translations, which stay open to correction,
// then every request whose translation waits for approval before members see it, longest wait first. Answered
// and deleted requests drop off by themselves (schema.sql 5d). Reads itself again on every arrival, like the
// other lists of what waits for an answer.
export default function TranslationReviews({ requests: loaded }: Props) {
  const { t } = useLanguage(); // I18N
  const requests = useFresh(loaded, getTranslationsToReview);

  return (
    <>
      <SectionHeading>{t(STRINGS.translationsHeading)}</SectionHeading>
      <ul>
        <ListRow title={t(STRINGS.pastTranslations)} href="/admin/translations" />
        {requests.map((request) => (
          <TranslationReviewRow key={request.id} request={request} />
        ))}
      </ul>
    </>
  );
}
