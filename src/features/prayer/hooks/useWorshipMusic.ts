"use client";

import { useEffect, useRef, useState } from "react";
import { nextRound } from "../playlist";
import { WORSHIP_SONGS } from "../types";

// The worship music under the prayer list: play and pause by the person, the next song when one ends (every
// song once per round, playlist.ts), stopped when they leave the tab. `playing` follows the audio's own
// events, so a pause by the phone (a call) shows too.
export function useWorshipMusic() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<string[]>([]); // the songs still to play in this round
  const song = useRef<string | null>(null); // the one in the player
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // played at least once on this visit

  useEffect(() => () => audio.current?.pause(), []);

  function playNextSong(player: HTMLAudioElement): Promise<void> {
    if (queue.current.length === 0) queue.current = nextRound(WORSHIP_SONGS, song.current);
    song.current = queue.current.shift()!;
    player.src = song.current;
    return player.play();
  }

  // Resolves to false when the phone could not play it (no file, no connection), for the board to say so.
  async function toggle(): Promise<boolean> {
    if (playing) {
      audio.current?.pause();
      return true;
    }
    // Made on the first tap, inside it: a phone plays sound only in answer to a tap. Later songs start from
    // `ended`, which a phone allows because the player is already playing.
    if (!audio.current) {
      const player = new Audio();
      player.onplay = () => setPlaying(true);
      player.onpause = () => setPlaying(false);
      player.onended = () => playNextSong(player).catch(() => {}); // offline: the music stops, Play starts it again
      audio.current = player;
    }
    try {
      await (song.current ? audio.current.play() : playNextSong(audio.current));
      setStarted(true);
      return true;
    } catch {
      return false;
    }
  }

  return { playing, started, toggle };
}
