"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { byWeekThenPerson } from "../grouping";
import { usePrayerCooldown } from "../hooks/usePrayerCooldown";
import { usePrayerFeed } from "../hooks/usePrayerFeed";
import { STRINGS } from "../strings";
import type { PostableGroup, PrayerRequest } from "../types";
import OlderRequestsMarker from "./OlderRequestsMarker";
import PrayerComposer from "./PrayerComposer";
import PrayerWeek from "./PrayerWeek";
import RequestOptions from "./RequestOptions";

type Props = { initialRequests: PrayerRequest[]; groups: PostableGroup[]; userId: string };

// The Prayer tab: the composer, then every request from my groups, by week and then by person.
// It connects the two hooks to the components below it; each of those only renders.
export default function PrayerBoard({ initialRequests, groups, userId }: Props) {
  const { t } = useLanguage(); // I18N
  const feed = usePrayerFeed(initialRequests);
  const cooldown = usePrayerCooldown(userId);
  const showBanner = useBanner();
  const [managing, setManaging] = useState<PrayerRequest | null>(null); // whose options are open

  // Says how an action went, then passes its answer on. `done` is left out where the screen already shows it.
  async function report(action: Promise<boolean>, done?: Text): Promise<boolean> {
    const worked = await action;
    if (!worked) showBanner({ kind: "error", message: t(STRINGS.failed) });
    else if (done) showBanner({ kind: "success", message: t(done) });
    return worked;
  }

  // The pause starts before the server answers, so a second tap cannot slip in while the first travels.
  async function pray(requestId: string) {
    cooldown.startPause(requestId);
    if (!(await report(feed.pray(requestId)))) cooldown.cancelPause(requestId);
  }

  if (groups.length === 0) return <EmptyState message={t(STRINGS.noGroups)} />;

  return (
    <div className="flex flex-col gap-4">
      <PrayerComposer groups={groups} onPost={(request) => report(feed.post(request), STRINGS.shared)} />

      {feed.requests.length === 0 ? (
        <EmptyState message={t(STRINGS.emptyState)} />
      ) : (
        byWeekThenPerson(feed.requests).map((week) => (
          <PrayerWeek key={week.start} week={week} showGroup={groups.length > 1} canPrayFor={cooldown.canPrayFor} onPray={pray} onManage={setManaging} />
        ))
      )}

      {feed.hasMore && <OlderRequestsMarker onReached={() => report(feed.loadOlder())} loadedSoFar={feed.requests.length} />}

      {managing && (
        <RequestOptions
          request={managing}
          onAnswered={() => report(feed.answer(managing.id), STRINGS.markAnswered)}
          onEdit={(body) => report(feed.edit(managing.id, body), STRINGS.saved)}
          onDelete={() => report(feed.remove(managing.id), STRINGS.deleted)}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}
