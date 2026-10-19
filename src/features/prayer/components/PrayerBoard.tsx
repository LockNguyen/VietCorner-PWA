"use client";

import { useRouter } from "next/navigation";
import { GO_FORWARD } from "@/lib/slide";
import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { byWeekThenPerson } from "../grouping";
import { usePrayerCooldown } from "../hooks/usePrayerCooldown";
import { usePrayerFeed } from "../hooks/usePrayerFeed";
import { useShowAfter } from "../hooks/useShowAfter";
import { useWorshipMusic } from "../hooks/useWorshipMusic";
import { STRINGS } from "../strings";
import { MUSIC_NUDGE_AFTER_MS, type PrayerRequest } from "../types";
import OlderRequestsMarker from "./OlderRequestsMarker";
import PrayerToolbar from "./PrayerToolbar";
import PrayerWeek from "./PrayerWeek";
import RequestOptions from "./RequestOptions";

type Props = {
  initialRequests: PrayerRequest[];
  userId: string;
  canManageReminders: boolean; // an admin: a bell beside the + opens the weekly reminders
};

// The Prayer tab: the toolbar (music, and the + that opens the screen for a new request), then every request
// in the church, by week and by person. It connects the hooks to the components below it; those only render.
export default function PrayerBoard({ initialRequests, userId, canManageReminders }: Props) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const feed = usePrayerFeed(initialRequests);
  const cooldown = usePrayerCooldown(userId);
  const showBanner = useBanner();
  const music = useWorshipMusic();
  const stayed = useShowAfter(MUSIC_NUDGE_AFTER_MS);
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
    navigator.vibrate?.(15); // a light tap felt in the hand, where the phone allows it (Android; not iPhone)
    cooldown.startPause(requestId);
    if (!(await report(feed.pray(requestId)))) cooldown.cancelPause(requestId);
  }

  async function toggleMusic() {
    if (!(await music.toggle())) showBanner({ kind: "error", message: t(STRINGS.musicFailed) });
  }

  const open = (href: string) => router.push(href, { transitionTypes: GO_FORWARD });

  return (
    <div className="flex flex-col gap-4">
      <PrayerToolbar
        canManageReminders={canManageReminders}
        playing={music.playing}
        nudging={stayed && !music.started} // once the music has played, the hint has done its job
        onReminders={() => open("/prayer/reminders")}
        onToggleMusic={toggleMusic}
        onAdd={() => open("/prayer/new")}
      />

      {feed.requests.length === 0 ? (
        <EmptyState message={t(STRINGS.emptyState)} />
      ) : (
        byWeekThenPerson(feed.requests).map((week) => (
          <PrayerWeek key={week.start} week={week} canPrayFor={cooldown.canPrayFor} onPray={pray} onManage={setManaging} />
        ))
      )}

      {feed.hasMore && <OlderRequestsMarker onReached={() => report(feed.loadOlder())} loadedSoFar={feed.requests.length} />}

      {managing && (
        <RequestOptions
          onAnswered={() => report(feed.answer(managing.id), STRINGS.markAnswered)}
          onEdit={() => open(`/prayer/${managing.id}/edit`)}
          onDelete={() => report(feed.remove(managing.id), STRINGS.deleted)}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}
