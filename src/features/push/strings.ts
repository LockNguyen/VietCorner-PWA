import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages.
export const STRINGS = {
  heading: { en: "Notifications", vi: "Thông báo" } satisfies Text,
  onThisDevice: { en: "On this device", vi: "Trên thiết bị này" } satisfies Text,
  notificationsBlocked: {
    en: "Notifications are blocked. Turn them on in your phone settings.",
    vi: "Thông báo đang bị chặn. Xin bật lại trong cài đặt điện thoại.",
  } satisfies Text,
  notificationsUnsupported: {
    en: "To get notifications, add this app to your Home Screen (Share → Add to Home Screen) and open it from there.",
    vi: "Để nhận thông báo, hãy thêm ứng dụng vào Màn hình chính (Chia sẻ → Thêm vào MH chính) rồi mở từ đó.",
  } satisfies Text,

  // The setup step (components/NotificationStep.tsx)
  askHeading: { en: "Turn on notifications", vi: "Bật thông báo" } satisfies Text,
  askWhy: {
    en: "So we can tell you when your account is ready, and when the church has news. Tap the button, then tap “Allow”.",
    vi: "Để chúng tôi báo khi tài khoản của bạn sẵn sàng, và khi nhà thờ có tin mới. Bấm nút bên dưới, rồi bấm “Cho phép”.",
  } satisfies Text,
  turnOn: { en: "Turn on notifications", vi: "Bật thông báo" } satisfies Text,
  notNow: { en: "No, I don’t want notifications for now", vi: "Không, tôi chưa muốn nhận thông báo" } satisfies Text,
};
