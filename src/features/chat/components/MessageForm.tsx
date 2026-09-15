"use client";

import { useState } from "react";

type Props = { onSend: (body: string) => Promise<void> };

// Text box + Send button. Clears immediately. If sending fails, shows why and puts the text back.
export default function MessageForm({ onSend }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError("");

    try {
      await onSend(body);
    } catch (error) {
      setError((error as Error).message); // e.g. no network, "Not signed in"
      setDraft(body);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded border p-3 text-lg" placeholder="Message" />
        <button className="rounded bg-blue-500 px-4 text-lg text-white">Send</button>
      </form>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </>
  );
}
