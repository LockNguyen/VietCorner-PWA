"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useScrollToEnd } from "@/lib/useScrollToEnd";
import { STRINGS } from "../strings";
import type { ChatMessage } from "../types";
import MessageBubble from "./MessageBubble";

type Props = {
  messages: ChatMessage[];
  countdown: number;
  onRetry: (messageId: string) => void;
  onSpeak: (text: string) => void;
};

// The conversation, newest at the bottom, scrolled into view like any chat app.
export default function MessageList({ messages, countdown, onRetry, onSpeak }: Props) {
  const { t } = useLanguage(); // I18N
  const end = useScrollToEnd(messages);

  if (messages.length === 0) return <EmptyState message={t(STRINGS.emptyState)} />;

  return (
    <div role="log" className="flex flex-col gap-4 px-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} countdown={countdown} onRetry={onRetry} onSpeak={onSpeak} />
      ))}
      <div ref={end} />
    </div>
  );
}
