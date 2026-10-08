"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useConversation } from "../hooks/useConversation";
import { STRINGS } from "../strings";
import { useVoiceQuestion } from "../hooks/useVoiceQuestion";
import * as speech from "../speech";
import MessageList from "./MessageList";
import QuestionForm from "./QuestionForm";
import VoiceButton from "./VoiceButton";

type Props = { userId: string };

// The assistant screen. Two hooks hold the state, four components render it.
// A typed question is answered in writing; a spoken one is also read aloud.
export default function AssistantChat({ userId }: Props) {
  const { t } = useLanguage(); // I18N
  const chat = useConversation(userId);
  const voice = useVoiceQuestion((question) => chat.send(question, { byVoice: true }));

  return (
    // The bottom padding is the room the microphone and the field take, so the last answer is not under them.
    <div className="flex flex-col pb-48">
      <div className="flex justify-end px-3">
        <Button variant="text" onClick={chat.newChat}>
          {t(STRINGS.newChat)}
        </Button>
      </div>

      <MessageList messages={chat.messages} countdown={chat.countdown} onRetry={chat.retry} onSpeak={speech.speak} />

      <QuestionForm disabled={chat.sending} onSend={(question) => chat.send(question)}>
        <div className="flex flex-col items-center gap-2 pt-1 text-center">
          {voice.notice && <Text tone="subtle">{t(voice.notice)}</Text>}
          <VoiceButton status={voice.status} recorderStatus={voice.recorderStatus} onToggle={voice.toggle} />
        </div>
      </QuestionForm>
    </div>
  );
}
