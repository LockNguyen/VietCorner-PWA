"use client";

import type { VoiceStatus } from "../hooks/useVoiceQuestion";
import type { RecorderStatus } from "../hooks/useVoiceRecorder";

type Props = {
  status: VoiceStatus;
  recorderStatus: RecorderStatus;
  onToggle: () => void;
};

const LABELS: Record<VoiceStatus, string> = {
  idle: "🎙️",
  recording: "⏹️",
  transcribing: "…",
};

// The big round microphone: tap to speak, tap to send. Large because our users are elderly.
export default function VoiceButton({ status, recorderStatus, onToggle }: Props) {
  if (recorderStatus === "unsupported") {
    return <p className="text-center text-sm text-red-600">This browser cannot record audio.</p>;
  }
  if (recorderStatus === "blocked") {
    return <p className="text-center text-sm text-red-600">The microphone is blocked. Allow it, then reload.</p>;
  }

  return (
    <button
      onClick={onToggle}
      disabled={status === "transcribing"}
      aria-label={status === "recording" ? "Gửi câu hỏi / Send question" : "Hỏi bằng giọng nói / Ask by voice"}
      className={`h-20 w-20 rounded-full text-3xl text-white disabled:opacity-60 ${
        status === "recording" ? "bg-red-600" : "bg-blue-500"
      }`}
    >
      {LABELS[status]}
    </button>
  );
}
