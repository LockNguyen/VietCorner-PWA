"use client";

import { Mic, Square } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { VoiceStatus } from "../hooks/useVoiceQuestion";
import type { RecorderStatus } from "../hooks/useVoiceRecorder";

type Props = {
  status: VoiceStatus;
  recorderStatus: RecorderStatus;
  onToggle: () => void;
};

// The big round microphone: tap to speak, tap to send. Large because our users are elderly.
export default function VoiceButton({ status, recorderStatus, onToggle }: Props) {
  const { t } = useLanguage(); // I18N

  if (recorderStatus === "unsupported") return <Text variant="small" tone="danger">{t(STRINGS.cannotRecord)}</Text>;
  if (recorderStatus === "blocked") return <Text variant="small" tone="danger">{t(STRINGS.microphoneBlocked)}</Text>;

  const recording = status === "recording";
  return (
    <IconButton
      size="large"
      tone={recording ? "danger" : "filled"}
      label={recording ? t(STRINGS.sendQuestion) : t(STRINGS.askByVoice)}
      onClick={onToggle}
      disabled={status === "transcribing"}
    >
      {status === "transcribing" ? <Spinner /> : recording ? <Square className="size-8" /> : <Mic className="size-8" />}
    </IconButton>
  );
}
