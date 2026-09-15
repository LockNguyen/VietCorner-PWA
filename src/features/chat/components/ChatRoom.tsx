"use client";

import { useChatMessages } from "../hooks/useChatMessages";
import type { Message } from "../types";
import MessageForm from "./MessageForm";
import MessageList from "./MessageList";

type Props = { groupId: string; myUserId: string; initialMessages: Message[] };

// A group's chat screen: the live message list plus the send form.
// How messages stay in sync lives in hooks/useChatMessages.ts.
export default function ChatRoom({ groupId, myUserId, initialMessages }: Props) {
  const { messages, send } = useChatMessages(groupId, initialMessages);

  return (
    <div className="p-4">
      <MessageList messages={messages} myUserId={myUserId} />
      <MessageForm onSend={send} />
    </div>
  );
}
