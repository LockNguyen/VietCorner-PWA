"use client";

import { Bell, Pause, Play, Plus } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import NudgeBubble from "@/components/ui/NudgeBubble";
import Toolbar from "@/components/ui/Toolbar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

type Props = {
  canManageReminders: boolean; // an admin: the bell for the weekly reminders
  playing: boolean;
  nudging: boolean; // show the bubble that suggests the music
  onReminders: () => void;
  onToggleMusic: () => void;
  onAdd: () => void;
};

// The buttons above the prayer list, held under the top bar while it scrolls (the user, 2026-10-19): the
// admin's bell, play or pause for the worship music, and the round + that writes a request.
export default function PrayerToolbar({ canManageReminders, playing, nudging, onReminders, onToggleMusic, onAdd }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <Toolbar>
      {canManageReminders && (
        <IconButton label={t(STRINGS.remindersHeading)} onClick={onReminders}>
          <Bell />
        </IconButton>
      )}
      {/* Right before play, so its tail points at it (the user, 2026-10-19). */}
      {nudging && <NudgeBubble>{t(STRINGS.prayNow)}</NudgeBubble>}
      <IconButton label={t(playing ? STRINGS.pauseMusic : STRINGS.playMusic)} onClick={onToggleMusic}>
        {playing ? <Pause /> : <Play />}
      </IconButton>
      <IconButton tone="filled" label={t(STRINGS.addRequest)} onClick={onAdd}>
        <Plus />
      </IconButton>
    </Toolbar>
  );
}
