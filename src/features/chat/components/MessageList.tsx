"use client";

import { useEffect, useRef } from "react";
import type { Message } from "../types";

type Props = { messages: Message[]; myUserId: string };

// Chat bubbles: mine on the right in blue, others on the left in gray. Scrolls to the newest message.
export default function MessageList({ messages, myUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <>
      <ul className="space-y-3">
        {messages.map((message) => {
          const mine = message.sender_id === myUserId;
          return (
            <li key={message.id} className={mine ? "text-right" : ""}>
              <div className="text-xs text-gray-500">{message.sender_email}</div>
              <div className={`inline-block rounded-lg px-3 py-2 text-lg ${mine ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                {message.body}
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />
    </>
  );
}
