"use client";

import { useState } from "react";
import { transcribeRecording } from "../api";
import type { Text } from "@/features/i18n/types"; // I18N
import { AssistantError, ERRORS } from "../errors";
import { STRINGS } from "../strings";
import * as speech from "../speech";
import { useVoiceRecorder } from "./useVoiceRecorder";

export type VoiceStatus = "idle" | "recording" | "transcribing";

// why: Whisper answers "" for silence, and sometimes invents a sentence from background noise. Too short
// a transcript is treated as "not heard" rather than sent to the assistant as a question.
const MIN_TRANSCRIPT_CHARS = 2;

// Turning speech into a question: hold the microphone, transcribe, hand the text to whoever asked.
//
// Why separate from useConversation: the conversation does not care where a question came from, and
// this hook does not care what happens to it afterwards. `onQuestion` is the seam between them.
export function useVoiceQuestion(onQuestion: (question: string) => void) {
  const recorder = useVoiceRecorder();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  // "didn't catch that" and recording failures. Text, not a string: the screen translates it.
  const [notice, setNotice] = useState<Text | null>(null);

  // One button: the first tap records, the second one sends.
  async function toggle() {
    if (status === "transcribing") return; // the previous recording is still being turned into text
    if (status === "recording") return finish();

    setNotice(null);
    speech.stop(); // the user is asking something new
    speech.prime(); // must happen during the tap, or iOS never speaks (see speech.ts)

    if (await recorder.start()) setStatus("recording");
  }

  async function finish() {
    const recording = await recorder.stop();
    setStatus("transcribing");

    try {
      const question = recording ? (await transcribeRecording(recording)).trim() : "";
      if (question.length < MIN_TRANSCRIPT_CHARS) {
        setNotice(STRINGS.notHeard);
        return;
      }
      onQuestion(question);
    } catch (failure) {
      // A failed transcription has no text to retry with, so the user simply taps the microphone again.
      setNotice(failure instanceof AssistantError ? ERRORS[failure.cause].message : STRINGS.notHeard);
    } finally {
      setStatus("idle");
    }
  }

  return { status, recorderStatus: recorder.status, notice, toggle };
}
