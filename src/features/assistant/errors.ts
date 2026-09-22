import type { ErrorCause } from "./types";

// What each failure means to a user, and whether trying again could help.
//
// Keyed by cause rather than by HTTP status, because the two most common failures produce no status:
// the phone is offline, or the request took too long. One table, so the wording and the retry policy
// are decided in a single place.
//
// Bilingual for now, like the rest of the app. When the i18n feature lands (Step 3), these strings move
// into the translation files and this table keeps only the keys.

export const ERRORS: Record<ErrorCause, { message: string; retryable: boolean }> = {
  offline: {
    message: "Không có kết nối mạng. / No internet connection.",
    retryable: true,
  },
  timeout: {
    message: "Trợ lý trả lời quá lâu. / The assistant took too long to answer.",
    retryable: true,
  },
  busy: {
    message: "Trợ lý đang bận. Xin thử lại sau một phút. / The assistant is busy. Try again in a minute.",
    retryable: true,
  },
  server: {
    message: "Trợ lý gặp sự cố. / The assistant had a problem.",
    retryable: true,
  },
  unauthorized: {
    // Retrying sends the same expired session, so the fix is signing in again, not trying again.
    message: "Bạn cần đăng nhập lại. / Please sign in again.",
    retryable: false,
  },
  invalid: {
    // The question was empty, too long, or the recording was unusable: the same request would fail again.
    message: "Câu hỏi không hợp lệ. Xin thử lại bằng câu ngắn hơn. / That question couldn't be sent. Try a shorter one.",
    retryable: false,
  },
};

// The one error type the feature throws. `cause` is what the UI shows and decides retries from.
export class AssistantError extends Error {
  constructor(readonly cause: ErrorCause) {
    super(ERRORS[cause].message);
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
