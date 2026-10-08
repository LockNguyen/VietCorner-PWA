"use client";

import Bubble from "@/components/ui/Bubble";
import Chip from "@/components/ui/Chip";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request. Someone else's carries Pray on its corner; my own opens its options when tapped.
// Nothing sits between two requests, so there is no doubt which one a button belongs to.
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
    // The padding is the room the chip takes below the bubble.
    <div className="flex w-full flex-col items-start pb-4">
      <Bubble
        tone="theirs"
        corner={
          <Chip tone={canPray ? "idle" : "done"} onClick={onPray} disabled={!canPray}>
            {t(canPray ? STRINGS.prayButton : STRINGS.prayed)}
          </Chip>
        }
      >
        {request.body}
      </Bubble>
    </div>
  );
}
