"use client";

import { useEffect, useState } from "react";
import { getLatestMessages, sendMessage, subscribeToNewMessages } from "../api";
import type { Message } from "../types";

// Keeps one group's message list in sync, and is the ONLY place that decides how. The five sources are
// numbered below and listed in the chat README; all go through mergeMessages, so nothing shows twice.
export function useChatMessages(groupId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState(initialMessages); // 1

  function addMessages(incoming: Message[]) {
    setMessages((current) => mergeMessages(current, incoming));
  }

  useEffect(() => {
    async function refetch() {
      try {
        addMessages(await getLatestMessages(groupId));
      } catch (error) {
        // Harmless: the next reconnect or return to the app refetches again.
        console.error("Refetching messages failed", error);
      }
    }

    function refetchIfVisible() {
      if (document.visibilityState === "visible") refetch();
    }

    const unsubscribe = subscribeToNewMessages(groupId, {
      onMessage: (message) => addMessages([message]), // 2
      onConnected: refetch, // 3
    });
    document.addEventListener("visibilitychange", refetchIfVisible); // 4

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", refetchIfVisible);
    };
  }, [groupId]);

  // 5. Throws if sending fails, so the form can show the error.
  async function send(body: string) {
    addMessages([await sendMessage(groupId, body)]);
  }

  return { messages, send };
}

// Adds messages we don't have yet (same id = same message) and keeps them in send order.
// Ids come from an identity column, so a higher id means a later message.
function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.id - b.id);
}
