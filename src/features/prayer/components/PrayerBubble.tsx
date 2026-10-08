"use client";

import { Check } from "lucide-react";
import Bubble from "@/components/ui/Bubble";
import Chip from "@/components/ui/Chip";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request. Someone else's has the round Pray button on its right edge, which turns into a green tick
// once prayed; my own opens its options when tapped.
export default function PrayerBubble({ request, canPray, onPray, onManage }: Props) {
  const { t } = useLanguage(); // I18N

  if (request.is_mine) {
    return (
      <Bubble tone="theirs" onClick={onManage}>
        {request.body}
      </Bubble>
    );
  }

  return (
    <div className="flex w-full items-end">
      <Bubble tone="theirs">{request.body}</Bubble>
      {/* Pulled over the bubble's edge, so it plainly belongs to this request and no other. */}
      <div className="-ms-3">
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
    </div>
  );
}
