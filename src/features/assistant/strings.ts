import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. The failure messages live in errors.ts, which
// pairs each cause with whether a retry could help.
export const STRINGS = {
  emptyState: {
    en: "Ask me about the church documents.",
    vi: "Hãy hỏi tôi bất cứ điều gì về tài liệu của hội thánh.",
  } satisfies Text,
  questionPlaceholder: { en: "Type a question", vi: "Nhập câu hỏi của bạn..." } satisfies Text,
  sendButton: { en: "Send", vi: "Gửi" } satisfies Text,
  newChat: { en: "New chat", vi: "Cuộc trò chuyện mới" } satisfies Text,
  readAloud: { en: "🔊 Read aloud", vi: "🔊 Nghe đọc" } satisfies Text,
  tryAgain: { en: "Try again", vi: "Thử lại" } satisfies Text,
  retryingIn: { en: "Retrying in", vi: "Thử lại sau" } satisfies Text,
  seconds: { en: "s", vi: "giây" } satisfies Text,
  page: { en: "page", vi: "trang" } satisfies Text,
  askByVoice: { en: "Ask by voice", vi: "Hỏi bằng giọng nói" } satisfies Text,
  sendQuestion: { en: "Send question", vi: "Gửi câu hỏi" } satisfies Text,
  notHeard: {
    en: "I didn't catch that, please try again.",
    vi: "Tôi chưa nghe rõ. Vui lòng thử lại.",
  } satisfies Text,
  cannotRecord: {
    en: "This browser cannot record audio.",
    vi: "Trình duyệt này không hỗ trợ ghi âm.",
  } satisfies Text,
  microphoneBlocked: {
    en: "The microphone is blocked. Allow it, then reload.",
    vi: "Microphone đang bị chặn. Vui lòng cấp quyền và tải lại trang.",
  } satisfies Text,
};
