"use client";

import { useRef, useState } from "react";
import type { Recording } from "../types";

export type RecorderStatus = "idle" | "recording" | "unsupported" | "blocked";

// Formats in order of preference. Whisper reads both; the browser picks the one it can record.
// Safari (iPhone) only offers mp4, Chrome and Android offer webm. The extension must match the format,
// because the speech API decides how to decode the audio from the file name.
const FORMATS = [
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/mp4", extension: "mp4" },
];

// The microphone, and nothing else: this hook knows how to record, not what a recording is for.
//
// Pitfalls handled here:
//  - The microphone light stays on until every track is stopped, which worries users.
//  - stop() is asynchronous: the audio is only complete in the recorder's "stop" event, so stop()
//    returns a promise that resolves with the finished recording.
export function useVoiceRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Ask for the microphone and start recording. Must be called from a tap: browsers only show the
  // permission prompt after a user gesture.
  async function start(): Promise<boolean> {
    const format = FORMATS.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType));
    if (typeof MediaRecorder === "undefined" || !format) {
      setStatus("unsupported");
      return false;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("blocked"); // the user said no, or the browser blocks the microphone on this page
      return false;
    }

    const recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
    recorderRef.current = recorder;
    recorder.start();
    setStatus("recording");
    return true;
  }

  // Stop recording and hand back the audio. Returns null if nothing was being recorded.
  function stop(): Promise<Recording | null> {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);

    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop()); // turns the microphone light off
        recorderRef.current = null;
        setStatus("idle");

        const extension = FORMATS.find((format) => format.mimeType === recorder.mimeType)?.extension ?? "webm";
        resolve({ blob: new Blob(chunks, { type: recorder.mimeType }), filename: `question.${extension}` });
      };
      recorder.stop();
    });
  }

  return { status, start, stop };
}
