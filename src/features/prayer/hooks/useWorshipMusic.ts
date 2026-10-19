"use client";

import { useEffect, useRef, useState } from "react";
import { WORSHIP_MUSIC_URL } from "../types";

// The worship music under the prayer list: one looping track, played and paused by the person, stopped when
// they leave the tab. `playing` follows the audio's own events, so a pause by the phone (a call) shows too.
export function useWorshipMusic() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // played at least once on this visit

  useEffect(() => () => audio.current?.pause(), []);

  // Resolves to false when the phone could not play it (no file, no connection), for the board to say so.
  async function toggle(): Promise<boolean> {
    if (playing) {
      audio.current?.pause();
      return true;
    }
    // Made on the first tap, inside it: a phone plays sound only in answer to a tap.
    if (!audio.current) {
      audio.current = new Audio(WORSHIP_MUSIC_URL);
      audio.current.loop = true;
      audio.current.onplay = () => setPlaying(true);
      audio.current.onpause = () => setPlaying(false);
    }
    try {
      await audio.current.play();
      setStarted(true);
      return true;
    } catch {
      return false;
    }
  }

  return { playing, started, toggle };
}
