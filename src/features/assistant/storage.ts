import type { ChatMessage } from "./types";

// The conversation, kept on the device so it survives closing the app. There is no server copy:
// the assistant stores nothing, which is also the cheapest way to keep church members' questions private.
//
// Keyed by user id, because families share phones and tablets here: without that, the next person to
// sign in on the same device would read the previous one's questions. Keying by user is what keeps them
// apart, so the auth feature needs no knowledge of this one; "New chat" is how a user clears their own
// history. The trade-off: after signing out, that user's questions stay on the device until they come
// back and clear them.

// why: enough to scroll back through a long visit, small enough to stay far below the ~5 MB
// localStorage allows. Older messages are dropped, oldest first.
const MAX_MESSAGES = 50;

function keyFor(userId: string): string {
  return `vietcorner.assistant.${userId}`;
}

// Never throws: storage can be unavailable (private mode) and old data can have an older shape.
// A reader that fails simply starts an empty conversation.
export function loadMessages(userId: string): ChatMessage[] {
  try {
    const stored = window.localStorage.getItem(keyFor(userId));
    const messages = stored ? JSON.parse(stored) : [];
    return Array.isArray(messages) ? messages : [];
  } catch {
    return [];
  }
}

export function saveMessages(userId: string, messages: ChatMessage[]): void {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Storage full or blocked. The conversation still works for this visit; it just won't come back.
  }
}

export function clearMessages(userId: string): void {
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // Nothing we can do, and nothing the user needs to know.
  }
}
