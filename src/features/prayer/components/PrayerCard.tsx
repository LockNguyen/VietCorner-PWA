"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { useExpandableText } from "../hooks/useExpandableText";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request: three lines and "more…". Other members get a Pray button; the author gets the options button.
export default function PrayerCard({ request, canPray, onPray, onManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const body = useExpandableText<HTMLParagraphElement>(request.body);

  const author = request.author_name ?? t(STRINGS.anonymous);
  const date = new Date(request.created_at).toLocaleDateString(LOCALES[language], { day: "numeric", month: "short" });

  return (
    <li className="rounded border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-500">
          {request.group_name} · {request.is_mine ? `${author} (${t(STRINGS.you)})` : author} · {date}
        </p>
        {request.is_mine && (
          <button onClick={onManage} aria-label={t(STRINGS.manage)} className="-mt-1 px-2 text-xl text-gray-500">
            X
          </button>
        )}
      </div>

      <p
        ref={body.paragraph}
        className={`mt-1 text-lg break-words whitespace-pre-wrap ${body.expanded ? "" : "line-clamp-3"}`}
      >
        {request.body}
      </p>
      {body.isClipped && (
        <button onClick={body.toggle} className="text-blue-500">
          {t(body.expanded ? STRINGS.showLess : STRINGS.showMore)}
        </button>
      )}

      {!request.is_mine && (
        <div className="mt-2 text-right">
          <button
            onClick={onPray}
            disabled={!canPray}
            className="rounded bg-blue-500 px-4 py-2 text-lg text-white disabled:bg-gray-300"
          >
            {t(canPray ? STRINGS.prayButton : STRINGS.prayed)}
          </button>
        </div>
      )}
    </li>
  );
}
