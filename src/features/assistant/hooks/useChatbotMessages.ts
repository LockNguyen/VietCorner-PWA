"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { askQuestion } from "../api";
import { AssistantError, ERRORS } from "../errors";
import * as speech from "../speech";
import { clearMessages, loadMessages, saveMessages } from "../storage";
import type { ChatMessage, ErrorCause, Turn } from "../types";

// why: a first retry after 5 s, then 7, 9, 11… Free providers rest for 60 s after a rate limit, so a
// second failure means waiting longer is the only thing that can help.
const FIRST_RETRY_SECONDS = 5;
const RETRY_STEP_SECONDS = 2;
// why: after about a minute of waiting, the service is down rather than busy, and the user is better
// served by a message that says so than by another countdown.
const MAX_RETRY_SECONDS = 60;

export function nextRetrySeconds(previous: number): number {
  return Math.min(previous + RETRY_STEP_SECONDS, MAX_RETRY_SECONDS);
}

// why: the service resolves a follow-up against the last two exchanges. More history costs tokens and
// drags older topics into the rewrite.
const HISTORY_TURNS = 4;

// The conversation: what is on screen, what is stored on the device, and what happens when a question fails.
//
// Why one hook: the message list, the in-flight question and the retry countdown are one piece of state.
// Splitting them would mean three hooks reading each other's results. The components below it only render.
export function useChatbotMessages(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0); // seconds left before a retry is sent, 0 when idle
  const retrySeconds = useRef(FIRST_RETRY_SECONDS); // grows while failures continue, resets on success
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loadedFor = useRef<string | null>(null); // the user whose conversation has been read back

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCountdown(0);
  }

  // Read this device's conversation once per user, then keep it in step with the screen.
  //
  // Load and save share one effect on purpose. As two effects, the save runs in the same commit as the
  // load, while `messages` is still the empty starting value, and every visit overwrites the stored
  // conversation with []. One effect makes the order impossible to get wrong: the run that loads never
  // saves, and every later run saves what is on screen.
  useEffect(() => {
    if (loadedFor.current !== userId) {
      loadedFor.current = userId;
      setMessages(loadMessages(userId)); // the first render matches the server's: it knows no device
      return;
    }
    saveMessages(userId, messages);
  }, [userId, messages]);

  // Leaving the screen cancels a pending retry.
  useEffect(() => clearTimers, []);

  // Ask the service, then replace the placeholder bubble with the answer or with an error.
  const answer = useCallback(
    async (question: string, placeholderId: string, byVoice: boolean, history: Turn[]) => {
      setSending(true);
      try {
        const result = await askQuestion(question, history);
        retrySeconds.current = FIRST_RETRY_SECONDS; // one success forgives the earlier failures
        setMessages((current) =>
          current.map((message) =>
            message.id === placeholderId
              ? { ...message, text: result.text, sources: result.sources, status: "done" }
              : message,
          ),
        );
        if (byVoice) speech.speak(result.text);
      } catch (failure) {
        const cause: ErrorCause = failure instanceof AssistantError ? failure.cause : "server";
        setMessages((current) =>
          current.map((message) =>
            message.id === placeholderId
              ? { ...message, text: ERRORS[cause].message, status: "error", errorCause: cause }
              : message,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [],
  );

  // The last few turns, oldest first, without failed ones: an error bubble explains nothing about "it".
  function recentTurns(current: ChatMessage[]): Turn[] {
    return current
      .filter((message) => message.status === "done")
      .slice(-HISTORY_TURNS)
      .map((message) => ({ role: message.role, text: message.text }));
  }

  // Send a question: the user's bubble and an empty answer bubble appear at once, so the wait is visible.
  function send(question: string, options: { byVoice?: boolean } = {}) {
    const text = question.trim();
    if (!text || sending) return; // one question at a time: a second send would race the first

    const placeholderId = crypto.randomUUID();
    const history = recentTurns(messages); // the conversation as the user sees it right now
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text, status: "done", askedByVoice: options.byVoice },
      { id: placeholderId, role: "assistant", text: "", status: "sending" },
    ]);

    void answer(text, placeholderId, Boolean(options.byVoice), history);
  }

  // Try a failed answer again, after a wait that grows with every failure. The error bubble goes back to
  // "thinking" so the user can see that something is happening.
  function retry(failedMessageId: string) {
    if (sending || countdown > 0) return;

    const index = messages.findIndex((message) => message.id === failedMessageId);
    const question = messages[index - 1]; // the user message this answer belongs to
    if (!question) return;

    const seconds = retrySeconds.current;
    retrySeconds.current = nextRetrySeconds(seconds);
    setCountdown(seconds);

    for (let remaining = seconds - 1; remaining >= 0; remaining--) {
      timers.current.push(setTimeout(() => setCountdown(remaining), (seconds - remaining) * 1000));
    }
    timers.current.push(
      setTimeout(() => {
        clearTimers();
        setMessages((current) =>
          current.map((message) =>
            message.id === failedMessageId
              ? { ...message, text: "", status: "sending", errorCause: undefined }
              : message,
          ),
        );
        void answer(
          question.text,
          failedMessageId,
          Boolean(question.askedByVoice),
          recentTurns(messages.slice(0, index - 1)),
        );
      }, seconds * 1000),
    );
  }

  // Start again: empties the screen and the device, cancels a pending retry, and stops any speech.
  function newChat() {
    clearTimers();
    speech.stop();
    retrySeconds.current = FIRST_RETRY_SECONDS;
    setMessages([]);
    clearMessages(userId);
  }

  return { messages, sending, countdown, send, retry, newChat };
}
