"use client";

import { Bell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { byWeekThenPerson } from "../grouping";
import { usePrayerCooldown } from "../hooks/usePrayerCooldown";
import { usePrayerFeed } from "../hooks/usePrayerFeed";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";
import OlderRequestsMarker from "./OlderRequestsMarker";
import PrayerComposer from "./PrayerComposer";
import PrayerWeek from "./PrayerWeek";
import RequestOptions from "./RequestOptions";

type Props = {
  initialRequests: PrayerRequest[];
  userId: string;
  canManageReminders: boolean; // an admin: a bell beside the + opens the weekly reminders
};

// The Prayer tab: the button that adds a request, then every request in the church, by week and by person.
// It connects the two hooks to the components below it; each of those only renders.
export default function PrayerBoard({ initialRequests, userId, canManageReminders }: Props) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const feed = usePrayerFeed(initialRequests);
  const cooldown = usePrayerCooldown(userId);
  const showBanner = useBanner();
  const [managing, setManaging] = useState<PrayerRequest | null>(null); // whose options are open
  const [writing, setWriting] = useState(false); // the sheet for a new request is open

  // Says how an action went, then passes its answer on. `done` is left out where the screen already shows it.
  async function report(action: Promise<boolean>, done?: Text): Promise<boolean> {
    const worked = await action;
    if (!worked) showBanner({ kind: "error", message: t(STRINGS.failed) });
    else if (done) showBanner({ kind: "success", message: t(done) });
    return worked;
  }

  // The pause starts before the server answers, so a second tap cannot slip in while the first travels.
  async function pray(requestId: string) {
    navigator.vibrate?.(15); // a light tap felt in the hand, where the phone allows it (Android; not iPhone)
    cooldown.startPause(requestId);
    if (!(await report(feed.pray(requestId)))) cooldown.cancelPause(requestId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-3 px-3 pt-2">
        {canManageReminders && (
          <IconButton label={t(STRINGS.remindersHeading)} onClick={() => router.push("/prayer/reminders")}>
            <Bell />
          </IconButton>
        )}
        <IconButton tone="filled" label={t(STRINGS.addRequest)} onClick={() => setWriting(true)}>
          <Plus />
        </IconButton>
      </div>

      {feed.requests.length === 0 ? (
        <EmptyState message={t(STRINGS.emptyState)} />
      ) : (
        byWeekThenPerson(feed.requests).map((week) => (
          <PrayerWeek key={week.start} week={week} canPrayFor={cooldown.canPrayFor} onPray={pray} onManage={setManaging} />
        ))
      )}

      {feed.hasMore && <OlderRequestsMarker onReached={() => report(feed.loadOlder())} loadedSoFar={feed.requests.length} />}

      {writing && (
        <PrayerComposer onPost={(request) => report(feed.post(request), STRINGS.shared)} onClose={() => setWriting(false)} />
      )}

      {managing && (
        <RequestOptions
          request={managing}
          onAnswered={() => report(feed.answer(managing.id), STRINGS.markAnswered)}
          onEdit={(body) => report(feed.edit(managing.id, body), COMMON.saved)}
          onDelete={() => report(feed.remove(managing.id), STRINGS.deleted)}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}
