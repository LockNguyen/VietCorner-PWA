"use client";

import { useEffect, useRef } from "react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <p className="p-4 text-center text-gray-500">
        Hỏi tôi về tài liệu của hội thánh. / Ask me about the church documents.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            countdown={countdown}
            onRetry={onRetry}
            onSpeak={onSpeak}
          />
        ))}
      </ul>
      <div ref={bottomRef} />
    </>
  );
}
