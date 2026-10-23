"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getTranslationsToReview } from "../api";
import { STRINGS } from "../strings";
import type { TranslationToReview } from "../types";
import TranslationReviewRow from "./TranslationReviewRow";

type Props = { requests: TranslationToReview[] }; // as the page loaded them

// Every request whose translation waits for approval before members see it, longest wait first; nothing at all
// when none waits. Answered and deleted requests drop off by themselves (schema.sql 5d). Reads itself again on
// every arrival, like the other lists of what waits for an answer.
export default function TranslationReviews({ requests: loaded }: Props) {
  const { t } = useLanguage(); // I18N
  const requests = useFresh(loaded, getTranslationsToReview);
  if (requests.length === 0) return null;

  return (
    <>
      <SectionHeading>{t(STRINGS.translationsHeading)}</SectionHeading>
      <ul>
        {requests.map((request) => (
          <TranslationReviewRow key={request.id} request={request} />
        ))}
      </ul>
    </>
  );
}
