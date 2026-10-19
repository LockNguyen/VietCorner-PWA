"use client";

import { Info } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import ListRow from "@/components/ui/ListRow";
import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useLaunchTimes } from "../hooks/useLaunchTimes";
import { seconds } from "../launchTimes";
import { STRINGS } from "../strings";

// The "i" on Home for admins, and the sheet with this launch's times and where its files came from.
export default function LaunchInfo({ renderedAt }: { renderedAt: number }) {
  const { t } = useLanguage(); // I18N
  const { times, show, hide } = useLaunchTimes(renderedAt);

  return (
    <>
      <div className="flex justify-end px-3 pt-2">
        <IconButton tone="filled" label={t(STRINGS.open)} onClick={show}>
          <Info />
        </IconButton>
      </div>

      {times && (
        <Sheet title={t(STRINGS.title)} closeLabel={t(COMMON.close)} onClose={hide}>
          <ul>
            <ListRow title={t(STRINGS.homeFrom)} trailing={t(times.savedHome ? STRINGS.savedCopy : STRINGS.server)} />
            <ListRow title={t(STRINGS.pageArrived)} subtitle={t(STRINGS.pageArrivedHint)} trailing={seconds(times.pageArrived)} />
            <ListRow title={t(STRINGS.filesRead)} trailing={seconds(times.filesRead)} />
            <ListRow title={t(STRINGS.tappable)} trailing={seconds(times.tappable)} />
            <ListRow title={t(STRINGS.allLoaded)} trailing={seconds(times.allLoaded)} />
            <ListRow title={t(STRINGS.filesSaved)} trailing={times.filesSaved} />
            <ListRow title={t(STRINGS.filesDownloaded)} trailing={times.filesDownloaded} />
          </ul>
          <Text variant="small" tone="subtle">{t(STRINGS.note)}</Text>
        </Sheet>
      )}
    </>
  );
}
