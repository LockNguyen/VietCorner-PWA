"use client";

import { useChatbotMessages } from "../hooks/useChatbotMessages";
import { useVoiceQuestion } from "../hooks/useVoiceQuestion";
import * as speech from "../speech";
import Composer from "./Composer";
import MessageList from "./MessageList";
import VoiceButton from "./VoiceButton";

type Props = { userId: string };

// The assistant screen. Two hooks hold the state, four components render it.
// A typed question is answered in writing; a spoken one is also read aloud.
export default function AssistantChat({ userId }: Props) {
  const chat = useChatbotMessages(userId);
  const voice = useVoiceQuestion((question) => chat.send(question, { byVoice: true }));

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <div className="flex justify-end p-2">
        <button onClick={chat.newChat} className="rounded border px-3 py-1 text-sm">
          Cuộc trò chuyện mới / New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <MessageList
          messages={chat.messages}
          countdown={chat.countdown}
          onRetry={chat.retry}
          onSpeak={speech.speak}
        />
      </div>

      <div className="space-y-3 border-t p-4">
        {voice.notice && <p className="text-center text-gray-500">{voice.notice}</p>}
        <div className="flex justify-center">
          <VoiceButton status={voice.status} recorderStatus={voice.recorderStatus} onToggle={voice.toggle} />
        </div>
        <Composer disabled={chat.sending} onSend={(question) => chat.send(question)} />
      </div>
    </div>
  );
}
