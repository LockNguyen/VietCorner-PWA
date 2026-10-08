"use client";

import { X } from "lucide-react";
import Bubble from "@/components/ui/Bubble";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { useExpandableText } from "../hooks/useExpandableText";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request: three lines and "more…", its group and day beneath. Others get Pray; the author gets the X.
export default function PrayerBubble({ request, canPray, onPray, onManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const body = useExpandableText<HTMLParagraphElement>(request.body);
  const date = new Date(request.created_at).toLocaleDateString(LOCALES[language], { day: "numeric", month: "short" });

  return (
    <div className="flex w-full flex-col items-start gap-1">
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

      <div className="flex items-center gap-2 ps-4">
        {!request.is_mine && (
          <Button variant="quiet" onClick={onPray} disabled={!canPray}>
            {t(canPray ? STRINGS.prayButton : STRINGS.prayed)}
          </Button>
        )}
        <Text as="span" variant="small" tone="subtle">
          {request.group_name} · {date}
        </Text>
      </div>
    </div>
  );
}
