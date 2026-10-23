"use client";

import { useEffect, useRef, useState } from "react";
import { keptOrNew, stepped, type Playlist } from "../playlist";
import { loadPlaylist, savePlaylist } from "../storage";
import { WORSHIP_SONGS } from "../types";

// off: nothing playing. loading: a song asked for and still on its way (the first seconds of a 3 MB file, or a
// pause to load more mid-song). playing: sound is coming out.
export type MusicState = "off" | "loading" | "playing";

// The worship music under the prayer list: play, pause, back and next through this phone's shuffled order of the
// songs (playlist.ts), the next song when one ends, stopped when they leave the tab. The state follows the audio's
// own events, so "playing" means sound is coming out, and a pause by the phone (a call) shows too.
//
// `onCannotPlay` is told only of a real failure (the user, 2026-10-22: "can't play" showed, then the music started):
// the file could not be loaded (the element's `error`), or the phone refused to play. A start cut short because a
// newer song replaced it (skipping fast, an `AbortError`) is not one, nor is a song still on its way.
export function useWorshipMusic(onCannotPlay: () => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const playlist = useRef<Playlist | null>(null);
  const [state, setState] = useState<MusicState>("off");
  const [started, setStarted] = useState(false); // played at least once on this visit: the suggesting bubble goes
  // The newest callback, for the player's events, which are set up once.
  const report = useRef(onCannotPlay);
  useEffect(() => {
    report.current = onCannotPlay;
  });

  useEffect(() => () => audio.current?.pause(), []);

  // Asks the player to play. Only a refusal is a failure; anything else that cuts it short is followed by another
  // request or by the element's own `error`.
  function play(player: HTMLAudioElement) {
    setState("loading");
    player.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setState("off");
        report.current();
      }
    });
  }

  // Plays the song `by` places from the current one, and keeps the new place for the next visit.
  function step(player: HTMLAudioElement, list: Playlist, by: number) {
    list.position = stepped(list.position, by, list.order.length);
    savePlaylist(list);
    player.src = encodeURI(WORSHIP_SONGS[list.order[list.position]]); // the file names have spaces
    play(player);
  }

  function toggle() {
    if (state !== "off") {
      audio.current?.pause(); // also stops a song still on its way
      return;
    }
    // Made on the first tap, inside it: a phone plays sound only in answer to a tap. Later songs start from
    // `ended`, which a phone allows because the player is already playing.
    if (!audio.current || !playlist.current) {
      const player = new Audio();
      const list = keptOrNew(loadPlaylist(), WORSHIP_SONGS.length);
      player.onplaying = () => {
        setState("playing");
        setStarted(true);
      };
      player.onwaiting = () => setState("loading"); // the next part of the song is still on its way
      player.onpause = () => setState("off");
      player.onended = () => step(player, list, 1);
      player.onerror = () => {
        setState("off"); // the file could not be loaded: missing, or no connection
        report.current();
      };
      audio.current = player;
      playlist.current = list;
    }
    const player = audio.current;
    // A visit's first Play starts the song after the one heard last; after that Play resumes where it paused.
    if (player.src) play(player);
    else step(player, playlist.current, 1);
  }

  // Back and Next: only offered while the music is on (PrayerToolbar), so the player exists.
  const skip = (by: number) => step(audio.current!, playlist.current!, by);

  return { state, started, toggle, next: () => skip(1), previous: () => skip(-1) };
}
