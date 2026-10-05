"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { prayedForYou, STRINGS } from "../strings";
import type { PrayerRequest } from "../types";

// why: about three lines of text on a phone. Shorter requests need no "more…" link; a link that expands
// nothing would be a lie. It is an estimate, because line length depends on the screen (see the README).
const LONG_BODY_CHARACTERS = 120;
const LONG_BODY_LINES = 3;

type Props = { request: PrayerRequest; canPray: boolean; onPray: () => void; onManage: () => void };

// One request. Other members get a Pray button; the author gets the count of prayers and an options button.
export default function PrayerCard({ request, canPray, onPray, onManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const [expanded, setExpanded] = useState(false);

  const isLong =
    request.body.length > LONG_BODY_CHARACTERS || request.body.split("\n").length > LONG_BODY_LINES;
  const author = request.author_email ?? t(STRINGS.anonymous);
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

      <p className={`mt-1 text-lg break-words whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}>
        {request.body}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-blue-500">
          {t(expanded ? STRINGS.showLess : STRINGS.showMore)}
        </button>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        {request.answered_at ? <span className="text-green-700">✓ {t(STRINGS.answered)}</span> : <span />}

        {/* Only the person prayed for is told, and only once there is something to tell. */}
        {request.is_mine && Boolean(request.prayer_count) && (
          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
            🙏 {t(prayedForYou(request.prayer_count ?? 0))}
          </span>
        )}

        {!request.is_mine && !request.answered_at && (
          <button
            onClick={onPray}
            disabled={!canPray}
            className="rounded bg-blue-500 px-4 py-2 text-lg text-white disabled:bg-gray-300"
          >
            {t(canPray ? STRINGS.prayButton : STRINGS.prayed)}
          </button>
        )}
      </div>
    </li>
  );
}
