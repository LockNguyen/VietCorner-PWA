"use client";

import Bubble from "@/components/ui/Bubble";
import BubbleRun from "@/components/ui/BubbleRun";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
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

// One turn: the user's question, an answer with its sources, or a failure with a way out.
// Props in, JSX out. Every decision it renders was made in a hook.
export default function MessageBubble({ message, countdown, onRetry, onSpeak }: Props) {
  const { t } = useLanguage(); // I18N
  const mine = message.role === "user";
  const error = message.status === "error" && message.errorCause ? ERRORS[message.errorCause] : null;

  if (mine) {
    return (
      <BubbleRun side="mine">
        <Bubble tone="mine">{message.text}</Bubble>
      </BubbleRun>
    );
  }

  return (
    <BubbleRun side="theirs">
      {message.status === "sending" ? (
        <Bubble tone="theirs">
          <Spinner />
        </Bubble>
      ) : (
        <Bubble tone={error ? "failed" : "theirs"}>{error ? t(error.message) : message.text}</Bubble>
      )}

      {error?.retryable && (
        <Button variant="text" onClick={() => onRetry(message.id)} disabled={countdown > 0}>
          {countdown > 0 ? `${t(STRINGS.retryingIn)} ${countdown}${t(STRINGS.seconds)}…` : t(STRINGS.tryAgain)}
        </Button>
      )}

      {message.status === "done" && (
        <>
          {/* Anyone can have an answer read again: a voice question read aloud once, or a typed one. */}
          <Button variant="text" onClick={() => onSpeak(message.text)}>
            {t(STRINGS.readAloud)}
          </Button>

          {/* Sources let a user check the answer against the real document, which is the point of RAG. */}
          {message.sources?.map((source, index) => (
            <div key={`${source.document}-${source.page_number}-${index}`} className="px-4">
              <Text variant="small" tone="subtle">
                [{index + 1}] {source.document}, {t(STRINGS.page)} {source.page_number}
              </Text>
            </div>
          ))}
        </>
      )}
    </BubbleRun>
  );
}
