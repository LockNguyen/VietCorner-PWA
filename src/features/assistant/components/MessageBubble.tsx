"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { ERRORS } from "../errors";
import { STRINGS } from "../strings";
import type { ChatMessage } from "../types";

type Props = {
  message: ChatMessage;
  countdown: number; // seconds left before a retry is sent, 0 when no retry is waiting
  onRetry: (messageId: string) => void;
  onSpeak: (text: string) => void;
};

// One bubble: the user's question, an answer with its sources, or a failure with a way out.
// Props in, JSX out. Every decision it renders was made in a hook.
export default function MessageBubble({ message, countdown, onRetry, onSpeak }: Props) {
  const { t } = useLanguage(); // I18N
  const mine = message.role === "user";
  const failed = message.status === "error";

  return (
    <li className={mine ? "text-right" : ""}>
      <div
        className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-left text-lg ${
          mine ? "bg-blue-500 text-white" : failed ? "bg-red-50 text-red-700" : "bg-gray-100"
        }`}
      >
        {message.status === "sending" ? (
          <span className="text-gray-500">…</span>
        ) : failed && message.errorCause ? (
          t(ERRORS[message.errorCause].message)
        ) : (
          message.text
        )}

        {failed && message.errorCause && ERRORS[message.errorCause].retryable && (
          <button
            onClick={() => onRetry(message.id)}
            disabled={countdown > 0}
            className="mt-1 block underline disabled:no-underline"
          >
            {countdown > 0 ? `${t(STRINGS.retryingIn)} ${countdown}${t(STRINGS.seconds)}…` : t(STRINGS.tryAgain)}
          </button>
        )}
      </div>

      {message.status === "done" && !mine && (
        <div className="mt-1 space-y-1">
          {/* Anyone can have an answer read again: a voice question read aloud once, or a typed one. */}
          <button onClick={() => onSpeak(message.text)} className="text-sm text-blue-500">
            {t(STRINGS.readAloud)}
          </button>

          {/* Sources let a user check the answer against the real document, which is the point of RAG. */}
          {message.sources && message.sources.length > 0 && (
            <ul className="text-sm text-gray-500">
              {message.sources.map((source, index) => (
                <li key={`${source.document}-${source.page_number}-${index}`}>
                  [{index + 1}] {source.document}, {t(STRINGS.page)} {source.page_number}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
