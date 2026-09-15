"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../types";

type Props = { groupId: string; myUserId: string; initialMessages: Message[] };

// Shows messages live and sends new ones.
// Sent messages are not added locally. They come back through Realtime like everyone else's, which avoids duplicates.
export default function ChatRoom({ groupId, myUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to new rows in this group's messages. RLS still decides what we receive.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError("");

    // Goes through our API (not straight to Supabase) because sending also triggers push notifications.
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, body }),
    });
    if (!response.ok) {
      setError((await response.json()).error);
      setDraft(body);
    }
  }

  return (
    <div className="p-4">
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

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded border p-3 text-lg" placeholder="Message" />
        <button className="rounded bg-blue-500 px-4 text-lg text-white">Send</button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
