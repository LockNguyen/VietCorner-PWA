"use client";

import { X } from "lucide-react";
import Bubble from "@/components/ui/Bubble";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { CHURCH_TIME_ZONE } from "@/lib/churchTime";
import { useExpandableText } from "../hooks/useExpandableText";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = {
  request: PrayerRequest;
  showGroup: boolean; // false for a member of one group: naming it on every request would be noise
  canPray: boolean;
  onPray: () => void;
  onManage: () => void;
};

// One request, top to bottom: the words (three lines and "more…"), its day, then Pray. The author gets
// the X beside the words instead of Pray.
export default function PrayerBubble({ request, showGroup, canPray, onPray, onManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const body = useExpandableText<HTMLParagraphElement>(request.body);
  // Church time, like every date in the app: the server and the phone then print the same day.
  const day = new Date(request.created_at).toLocaleDateString(LOCALES[language], {
    day: "numeric",
    month: "short",
    timeZone: CHURCH_TIME_ZONE,
  });

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex w-full items-start">
        <Bubble tone="theirs">
          <p ref={body.paragraph} className={body.expanded ? undefined : "line-clamp-3"}>
            {request.body}
          </p>
        </Bubble>
        {request.is_mine && (
          <IconButton label={t(STRINGS.manage)} onClick={onManage}>
            <X />
          </IconButton>
        )}
      </div>

      {body.isClipped && (
        <Button variant="text" onClick={body.toggle}>
          {t(body.expanded ? STRINGS.showLess : STRINGS.showMore)}
        </Button>
      )}

      <div className="ps-4">
        <Text variant="small" tone="subtle">
          {showGroup ? `${request.group_name} · ${day}` : day}
        </Text>
      </div>

      {!request.is_mine && (
        <Button variant="quiet" onClick={onPray} disabled={!canPray}>
          {t(canPray ? STRINGS.prayButton : STRINGS.prayed)}
        </Button>
      )}
    </div>
  );
}
