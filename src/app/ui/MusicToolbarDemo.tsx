"use client";

import { useState } from "react";
import type { MusicState } from "@/features/prayer/hooks/useWorshipMusic"; // PRAYER
import PrayerToolbar from "@/features/prayer/components/PrayerToolbar"; // PRAYER

// why: long enough to see the turning circle a song shows while it is on its way.
const PRETEND_LOADING_MS = 1500;

// The Prayer tab's toolbar with pretend music: Play turns while the song "loads", then shows Pause, with Back and
// Next in a grey pill; Pause folds them away.
export default function MusicToolbarDemo() {
  const [started, setStarted] = useState(false); // the bubble goes once the music has played
  const [music, setMusic] = useState<MusicState>("off");

  function toggle() {
    if (music !== "off") return setMusic("off");
    setMusic("loading");
    setTimeout(() => {
      setMusic("playing");
      setStarted(true);
    }, PRETEND_LOADING_MS);
  }

  return (
    <PrayerToolbar
      canManageReminders
      music={music}
      nudging={!started}
      onReminders={() => {}}
      onToggleMusic={toggle}
      onPrevious={() => {}}
      onNext={() => {}}
      onAdd={() => {}}
    />
  );
}
