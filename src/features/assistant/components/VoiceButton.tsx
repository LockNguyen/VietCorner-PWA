"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
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
  const { t } = useLanguage(); // I18N

  if (recorderStatus === "unsupported") {
    return <p className="text-center text-sm text-red-600">{t(STRINGS.cannotRecord)}</p>;
  }
  if (recorderStatus === "blocked") {
    return <p className="text-center text-sm text-red-600">{t(STRINGS.microphoneBlocked)}</p>;
  }

  return (
    <button
      onClick={onToggle}
      disabled={status === "transcribing"}
      aria-label={status === "recording" ? t(STRINGS.sendQuestion) : t(STRINGS.askByVoice)}
      className={`h-20 w-20 rounded-full text-3xl text-white disabled:opacity-60 ${
        status === "recording" ? "bg-red-600" : "bg-blue-500"
      }`}
    >
      {LABELS[status]}
    </button>
  );
}
