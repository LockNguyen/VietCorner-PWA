"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { GO_FORWARD } from "@/lib/slide";
import { useSave } from "@/lib/useSave";
import { reviewTranslation } from "../api";
import { STRINGS } from "../strings";
import type { TranslationToReview } from "../types";

type Props = { request: TranslationToReview };

const BADGE = "me-2 rounded-full bg-fill px-2 py-0.5 text-small font-semibold text-subtle";

// One request as written, with its language (VI or EN), and under it the translation waiting for approval.
// Approve shows the translation to members as it is; Edit opens a screen to correct it first. A request the AI
// service could not translate has no translation, so only Edit, to write one.
export default function TranslationReviewRow({ request }: Props) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const { pending, save } = useSave<"approve">();
  const { translation } = request;

  return (
    <li className="ms-3 flex flex-col gap-2 border-b border-line py-3 pe-3">
      <Text>
        {request.language && <span className={BADGE}>{request.language.toUpperCase()}</span>}
        {request.body}
      </Text>
      <Text tone="subtle">{translation ?? t(STRINGS.noTranslation)}</Text>
      <div className="flex gap-2">
        {translation && (
          <Button
            pending={pending === "approve"}
            disabled={pending !== null}
            onClick={() =>
              save("approve", () => reviewTranslation(request, translation), {
                done: t(STRINGS.translationApproved),
                failed: t(COMMON.couldNotSave),
              })
            }
          >
            {t(STRINGS.approveTranslation)}
          </Button>
        )}
        <Button
          variant="quiet"
          disabled={pending !== null}
          onClick={() => router.push(`/admin/translations/${request.id}`, { transitionTypes: GO_FORWARD })}
        >
          {t(STRINGS.editTranslation)}
        </Button>
      </div>
    </li>
  );
}
