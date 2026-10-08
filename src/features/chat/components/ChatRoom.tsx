"use client";

import { useNames } from "@/features/profiles/hooks/useNames"; // PROFILES
import type { Names } from "@/features/profiles/types"; // PROFILES
import { useChatMessages } from "../hooks/useChatMessages";
import type { Message } from "../types";
import MessageForm from "./MessageForm";
import MessageList from "./MessageList";

type Props = { groupId: string; myUserId: string; initialMessages: Message[]; initialNames: Names };

// A group's chat screen: the live message list plus the send form.
// How messages stay in sync lives in hooks/useChatMessages.ts.
export default function ChatRoom({ groupId, myUserId, initialMessages, initialNames }: Props) {
  const { messages, send } = useChatMessages(groupId, initialMessages);
  // PROFILES: a live message carries only its sender's id; this fetches the name of anyone new.
  const names = useNames(messages.map((message) => message.sender_id), initialNames);

  return (
    <>
      <MessageList messages={messages} names={names} myUserId={myUserId} />
      <MessageForm onSend={send} />
    </>
  );
}
