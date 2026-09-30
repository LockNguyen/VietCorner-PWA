import type { Text } from "@/features/i18n/types"; // I18N
import type { ErrorCause } from "./types";

// What each failure means to a user, and whether trying again could help.
//
// Keyed by cause rather than by HTTP status, because the two most common failures produce no status:
// the phone is offline, or the request took too long. One table, so the wording and the retry policy are
// decided in a single place.

export const ERRORS: Record<ErrorCause, { message: Text; retryable: boolean }> = {
  offline: {
    message: { en: "No internet connection.", vi: "Không có kết nối mạng." },
    retryable: true,
  },
  timeout: {
    message: { en: "The assistant took too long to answer.", vi: "Trợ lý trả lời quá lâu." },
    retryable: true,
  },
  busy: {
    message: {
      en: "The assistant is busy. Try again in a minute.",
      vi: "Trợ lý đang bận. Xin thử lại sau một phút.",
    },
    retryable: true,
  },
  server: {
    message: { en: "The assistant had a problem.", vi: "Trợ lý gặp sự cố." },
    retryable: true,
  },
  unauthorized: {
    // Retrying sends the same expired session, so the fix is signing in again, not trying again.
    message: { en: "Please sign in again.", vi: "Bạn cần đăng nhập lại." },
    retryable: false,
  },
  invalid: {
    // The question was empty, too long, or the recording was unusable: the same request would fail again.
    message: {
      en: "That question couldn't be sent. Try a shorter one.",
      vi: "Câu hỏi không hợp lệ. Xin thử lại bằng câu ngắn hơn.",
    },
    retryable: false,
  },
};

// The one error type the feature throws. `cause` is what the UI shows and decides retries from.
// The message is looked up at render time, in the reader's language.
export class AssistantError extends Error {
  constructor(readonly cause: ErrorCause) {
    super(cause);
    this.name = "AssistantError";
  }
}

// HTTP status → cause. Anything unexpected counts as a server fault, which is retryable.
export function causeForStatus(status: number): ErrorCause {
  if (status === 401) return "unauthorized";
  if (status === 400 || status === 413 || status === 422) return "invalid";
  if (status === 503) return "busy";
  return "server";
}
