import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages.
export const STRINGS = {
  messagePlaceholder: { en: "Message", vi: "Tin nhắn" } satisfies Text,
  sendButton: { en: "Send", vi: "Gửi" } satisfies Text,
  joinButton: { en: "Join", vi: "Tham gia" } satisfies Text,
  notificationsOn: {
    en: "🔔 Notifications are on for this device.",
    vi: "🔔 Thiết bị này đã bật thông báo.",
  } satisfies Text,
  notificationsBlocked: {
    en: "Notifications are blocked. Turn them on in your phone settings.",
    vi: "Thông báo đang bị chặn. Xin bật lại trong cài đặt điện thoại.",
  } satisfies Text,
  notificationsUnsupported: {
    en: "To get notifications, add this app to your Home Screen (Share → Add to Home Screen) and open it from there.",
    vi: "Để nhận thông báo, hãy thêm ứng dụng vào Màn hình chính (Chia sẻ → Thêm vào MH chính) rồi mở từ đó.",
  } satisfies Text,
  turnOnNotifications: { en: "Turn on notifications", vi: "Bật thông báo" } satisfies Text,
  couldNotSave: { en: "Could not save. Please try again.", vi: "Không lưu được. Xin thử lại." } satisfies Text,
};
