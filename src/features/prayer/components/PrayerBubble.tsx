"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import Bubble from "@/components/ui/Bubble";
import Celebrate from "@/components/ui/Celebrate";
import Chip from "@/components/ui/Chip";
import CountPill from "@/components/ui/CountPill";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { shownText } from "../shownText";
import { peoplePrayed, prayedForYou, STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request with what goes beside it, level with its middle. Someone else's: the Pray button with how many
// prayed ("3 🙏"), a green "4 ✓" once prayed (with a moment of thanks right after the tap). My own: how many
// prayed ("3 🙏"), then a small grey pencil, which opens its options.
export default function PrayerBubble({ request, canPray, onPray, onManage }: Props) {
  const { language, t } = useLanguage(); // I18N
  const text = shownText(request, language); // in my language once a translation is approved
  const [justPrayed, setJustPrayed] = useState(false); // tapped here, now: the tick celebrates once

  if (request.is_mine) {
    return (
      <div className="flex w-full items-center gap-2">
        <Bubble tone="theirs">{text}</Bubble>
        <CountPill label={t(prayedForYou(request.prayer_count))}>{request.prayer_count} 🙏</CountPill>
        <Chip tone="quiet" size="small" label={t(STRINGS.manage)} onClick={onManage}>
          <Pencil aria-hidden className="size-4" />
        </Chip>
      </div>
    );
  }

  // Someone else's request shows how many prayed too, left of the icon (the user, 2026-10-22): "3 🙏", then "4 ✓".
  const count = `${request.prayer_count}`;
  const said = t(peoplePrayed(request.prayer_count));
  const tick = (
    <Chip tone="done" size="wide" label={`${t(STRINGS.prayed)}, ${said}`} disabled>
      {count} <Check aria-hidden />
    </Chip>
  );

  return (
    <div className="flex w-full items-center gap-2">
      <Bubble tone="theirs">{text}</Bubble>
      {canPray ? (
        <Chip
          tone="pray"
          size="wide"
          data-action="pray" // counted by analytics as an action, whatever the button's words
          label={`${t(STRINGS.prayButton)}, ${said}`}
          onClick={() => {
            setJustPrayed(true);
            onPray();
          }}
        >
          {count} 🙏
        </Chip>
      ) : justPrayed ? (
        <Celebrate burst="+1">{tick}</Celebrate>
      ) : (
        tick
      )}
    </div>
  );
}
