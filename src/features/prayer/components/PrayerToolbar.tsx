"use client";

import { Bell, Pause, Play, Plus, SkipBack, SkipForward } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import Spinner from "@/components/ui/Spinner";
import NudgeBubble from "@/components/ui/NudgeBubble";
import Toolbar from "@/components/ui/Toolbar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { MusicState } from "../hooks/useWorshipMusic";
import { STRINGS } from "../strings";

type Props = {
  canManageReminders: boolean; // an admin: the bell for the weekly reminders
  music: MusicState; // off: Play; loading: a turning circle (a song on its way); playing: Pause
  nudging: boolean; // show the bubble that suggests the music
  onReminders: () => void;
  onToggleMusic: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAdd: () => void;
};

// While music plays, Back and Next grow out of the play button and a light grey pill, as tall as the + beside it,
// wraps all three: one group (the user, 2026-10-22). Pause shrinks it back to the play button alone. Both ways
// are the same width and colour transition; folded away, Back and Next are `inert`, so they take no tap or focus.
const GROUP = "flex items-center rounded-full transition-colors duration-300";
const SIDE = "overflow-hidden transition-[width,opacity] duration-300";
const OPEN = { group: "bg-fill", side: "w-touch opacity-100" } as const;
const SHUT = { group: "bg-transparent", side: "w-0 opacity-0" } as const;

// `data-action` on the music's buttons: analytics counts them by these names (its useTapTracking, the user
// 2026-10-22), nothing here imports it.
// What the middle button says to a screen reader in each state.
const MIDDLE = { off: STRINGS.playMusic, loading: STRINGS.loadingMusic, playing: STRINGS.pauseMusic } as const;

// The buttons above the prayer list, held under the top bar while it scrolls (the user, 2026-10-19): the
// admin's bell, play or pause for the worship music (Back and Next beside it while it plays), and the round
// + that writes a request.
export default function PrayerToolbar(props: Props) {
  const { canManageReminders, music, nudging, onReminders, onToggleMusic, onPrevious, onNext, onAdd } = props;
  const { t } = useLanguage(); // I18N
  const on = music !== "off"; // loading counts: Back and Next stay usable while a song is on its way
  const look = on ? OPEN : SHUT;

  return (
    <Toolbar>
      {canManageReminders && (
        <IconButton label={t(STRINGS.remindersHeading)} onClick={onReminders}>
          <Bell />
        </IconButton>
      )}
      {/* Right before play, so its tail points at it (the user, 2026-10-19). */}
      {nudging && <NudgeBubble>{t(STRINGS.prayNow)}</NudgeBubble>}
      <span className={`${GROUP} ${look.group}`}>
        <span inert={!on} className={`${SIDE} ${look.side}`}>
          <IconButton label={t(STRINGS.previousSong)} onClick={onPrevious} data-action="music-previous">
            <SkipBack />
          </IconButton>
        </span>
        {/* While a song is on its way the middle button turns (the user, 2026-10-22); a tap still stops it. */}
        <IconButton label={t(MIDDLE[music])} onClick={onToggleMusic} data-action={music === "off" ? "music-play" : "music-pause"}>
          {music === "off" ? <Play /> : music === "loading" ? <Spinner /> : <Pause />}
        </IconButton>
        <span inert={!on} className={`${SIDE} ${look.side}`}>
          <IconButton label={t(STRINGS.nextSong)} onClick={onNext} data-action="music-next">
            <SkipForward />
          </IconButton>
        </span>
      </span>
      <IconButton tone="filled" label={t(STRINGS.addRequest)} onClick={onAdd}>
        <Plus />
      </IconButton>
    </Toolbar>
  );
}
