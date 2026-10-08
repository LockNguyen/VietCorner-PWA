"use client";

import { Check, Pencil } from "lucide-react";
import Bubble from "@/components/ui/Bubble";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request with its one button beside it, level with its middle. Someone else's: the round Pray button,
// a green tick once prayed. My own: the pencil, which opens its options.
export default function PrayerBubble({ request, canPray, onPray, onManage }: Props) {
  const { t } = useLanguage(); // I18N

  if (request.is_mine) {
    return (
      <div className="flex w-full items-center gap-2">
        <Bubble tone="theirs">{request.body}</Bubble>
        <Button variant="quiet" aria-label={t(STRINGS.manage)} onClick={onManage}>
          <Pencil aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <Bubble tone="theirs">{request.body}</Bubble>
      {canPray ? (
        <Chip tone="pray" label={t(STRINGS.prayButton)} onClick={onPray}>
          🙏
        </Chip>
      ) : (
        <Chip tone="done" label={t(STRINGS.prayed)} disabled>
          <Check aria-hidden />
        </Chip>
      )}
    </div>
  );
}
