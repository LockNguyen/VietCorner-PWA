"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import Bubble from "@/components/ui/Bubble";
import Celebrate from "@/components/ui/Celebrate";
import Chip from "@/components/ui/Chip";
import CountPill from "@/components/ui/CountPill";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { prayedForYou, STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request with what goes beside it, level with its middle. Someone else's: the round Pray button, a green
// tick once prayed (with a moment of thanks right after the tap). My own: how many prayed ("3 🙏"), then a
// small grey pencil, which opens its options.
export default function PrayerBubble({ request, canPray, onPray, onManage }: Props) {
  const { t } = useLanguage(); // I18N
  const [justPrayed, setJustPrayed] = useState(false); // tapped here, now: the tick celebrates once

  if (request.is_mine) {
    return (
      <div className="flex w-full items-center gap-2">
        <Bubble tone="theirs">{request.body}</Bubble>
        {request.prayer_count !== null && (
          <CountPill label={t(prayedForYou(request.prayer_count))}>{request.prayer_count} 🙏</CountPill>
        )}
        <Chip tone="quiet" size="small" label={t(STRINGS.manage)} onClick={onManage}>
          <Pencil aria-hidden className="size-4" />
        </Chip>
      </div>
    );
  }

  const tick = (
    <Chip tone="done" label={t(STRINGS.prayed)} disabled>
      <Check aria-hidden />
    </Chip>
  );

  return (
    <div className="flex w-full items-center gap-2">
      <Bubble tone="theirs">{request.body}</Bubble>
      {canPray ? (
        <Chip
          tone="pray"
          label={t(STRINGS.prayButton)}
          onClick={() => {
            setJustPrayed(true);
            onPray();
          }}
        >
          🙏
        </Chip>
      ) : justPrayed ? (
        <Celebrate burst="+1">{tick}</Celebrate>
      ) : (
        tick
      )}
    </div>
  );
}
