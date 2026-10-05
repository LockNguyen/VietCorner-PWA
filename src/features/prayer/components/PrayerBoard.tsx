"use client";

import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePrayerCooldown } from "../hooks/usePrayerCooldown";
import { usePrayerFeed } from "../hooks/usePrayerFeed";
import { STRINGS } from "../strings";
import type { PostableGroup, PrayerRequest } from "../types";
import OlderRequestsMarker from "./OlderRequestsMarker";
import PrayerCard from "./PrayerCard";
import PrayerComposer from "./PrayerComposer";
import RequestOptions from "./RequestOptions";

type Props = { initialRequests: PrayerRequest[]; groups: PostableGroup[]; userId: string };

// The Prayer tab: the composer, then every request from my groups, newest first.
// It connects the two hooks to the components below it; each of those only renders.
export default function PrayerBoard({ initialRequests, groups, userId }: Props) {
  const { t } = useLanguage(); // I18N
  const feed = usePrayerFeed(initialRequests);
  const cooldown = usePrayerCooldown(userId);
  const [managing, setManaging] = useState<PrayerRequest | null>(null); // whose options are open

  // The pause starts before the server answers, so a second tap cannot slip in while the first travels.
  async function pray(requestId: string) {
    cooldown.startPause(requestId);
    if (!(await feed.pray(requestId))) cooldown.cancelPause(requestId);
  }

  if (groups.length === 0) return <p className="p-4 text-center text-lg text-gray-500">{t(STRINGS.noGroups)}</p>;

  return (
    <div className="p-4">
      <PrayerComposer groups={groups} onPost={feed.post} />

      {feed.failed && (
        <p role="alert" className="mt-3 text-red-600">
          {t(STRINGS.failed)}
        </p>
      )}

      {feed.requests.length === 0 ? (
        <p className="mt-6 text-center text-gray-500">{t(STRINGS.emptyState)}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {feed.requests.map((request) => (
            <PrayerCard
              key={request.id}
              request={request}
              canPray={cooldown.canPrayFor(request.id)}
              onPray={() => pray(request.id)}
              onManage={() => setManaging(request)}
            />
          ))}
        </ul>
      )}

      {feed.hasMore && <OlderRequestsMarker onReached={feed.loadOlder} loadedSoFar={feed.requests.length} />}

      {managing && (
        <RequestOptions
          request={managing}
          onAnswered={() => feed.answer(managing.id)}
          onEdit={(body) => feed.edit(managing.id, body)}
          onDelete={() => feed.remove(managing.id)}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}
