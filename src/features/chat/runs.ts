import type { Message } from "./types";

// A conversation as it is drawn: runs of one sender's messages, with a time wherever it resumed.
// Pure, so the grouping is tested without a screen.

export type ChatItem =
  | { kind: "time"; at: string } // the `created_at` of the message that resumed the conversation
  | { kind: "run"; senderId: string; messages: Message[] };

// why: no time is shown on a bubble (decided: an uncluttered conversation). An hour of silence is long
// enough that "when was this said?" becomes a real question again.
export const QUIET_GAP_MS = 60 * 60 * 1000;

// `messages` are oldest first, as the chat holds them.
export function intoRuns(messages: Message[]): ChatItem[] {
  const items: ChatItem[] = [];
  let previous: Message | undefined;

  for (const message of messages) {
    const resumed = !previous || Date.parse(message.created_at) - Date.parse(previous.created_at) >= QUIET_GAP_MS;
    if (resumed) items.push({ kind: "time", at: message.created_at });

    // A time between two messages of one sender also splits their run: the name is worth repeating.
    const last = items.at(-1);
    if (last?.kind === "run" && last.senderId === message.sender_id) last.messages.push(message);
    else items.push({ kind: "run", senderId: message.sender_id, messages: [message] });

    previous = message;
  }

  return items;
}
