"use client";

import { Pencil, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CountPill from "@/components/ui/CountPill";
import IconButton from "@/components/ui/IconButton";
import ListRow from "@/components/ui/ListRow";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LANGUAGE_NAMES } from "@/features/i18n/types"; // I18N
import { GO_FORWARD } from "@/lib/slide";
import { useTranslationReview } from "../hooks/useTranslationReview";
import { STRINGS } from "../strings";
import type { PrayerTranslation } from "../types";

type Props = { request: PrayerTranslation };

// One request as written, with its language (VI or EN) before it and its translation under it, on either of the
// reviewers' lists. Approve (waiting ones only) shows the translation to members as it is; the pencil opens a screen
// to correct it; the circular arrow asks the AI service again (the user, 2026-10-23), which puts it back on the
// waiting list. A request the AI service could not translate has nothing to approve: the pencil writes one.
export default function TranslationReviewRow({ request }: Props) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const { pending, approve, retry } = useTranslationReview();
  const { translation, language } = request;
  const waiting = request.translation_reviewed_at === null;

  return (
    <ListRow
      leading={language && <CountPill label={LANGUAGE_NAMES[language]}>{language.toUpperCase()}</CountPill>}
      title={request.body}
      subtitle={translation ?? t(STRINGS.noTranslation)}
      trailing={
        <>
          {/* Only with a language: the AI service writes both, and a translation written by hand gets its language
              on the edit screen. */}
          {waiting && translation && language && (
            <Button
              pending={pending === "approve"}
              disabled={pending !== null}
              onClick={() => approve(request, translation, language)}
            >
              {t(STRINGS.approveTranslation)}
            </Button>
          )}
          <IconButton
            label={t(STRINGS.editTranslation)}
            disabled={pending !== null}
            onClick={() => router.replace(`/admin/translations/${request.id}`, { transitionTypes: GO_FORWARD })}
          >
            <Pencil aria-hidden />
          </IconButton>
          <IconButton
            label={t(STRINGS.retryTranslation)}
            disabled={pending !== null}
            onClick={() => retry(request)}
          >
            {pending === "retry" ? <Spinner /> : <RotateCw aria-hidden />}
          </IconButton>
        </>
      }
    />
  );
}
