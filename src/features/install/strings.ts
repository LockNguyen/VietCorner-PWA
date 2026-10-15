import type { Text } from "@/features/i18n/types"; // I18N
import { APP_NAME } from "@/lib/appName";

// Every word this feature shows a user, in both languages. Menu names are quoted as the phone shows them.
export const STRINGS = {
  heading: { en: `Put ${APP_NAME} on your phone`, vi: `Cài ${APP_NAME} vào điện thoại` } satisfies Text,
  why: {
    en: "It takes a minute. Then it opens like any app, and it can tell you when something new arrives.",
    vi: "Chỉ mất một phút. Sau đó ứng dụng mở như mọi ứng dụng khác và có thể báo cho bạn khi có tin mới.",
  } satisfies Text,

  // iPhone and iPad: Safari has no install button a web page can press, so the steps are told.
  iphoneShare: {
    en: "Tap the Share button at the bottom of the screen. If you do not see it, tap ⋯ first.",
    vi: "Bấm nút Chia sẻ ở cuối màn hình. Nếu không thấy, hãy bấm ⋯ trước.",
  } satisfies Text,
  iphoneAdd: {
    en: "Scroll down and tap “Add to Home Screen”.",
    vi: "Kéo xuống và bấm “Thêm vào MH chính”.",
  } satisfies Text,
  iphoneConfirm: { en: "Tap “Add” at the top right.", vi: "Bấm “Thêm” ở góc trên bên phải." } satisfies Text,

  // Android: Chrome's own dialog when it offers one, otherwise its menu.
  installButton: { en: "Install the app", vi: "Cài ứng dụng" } satisfies Text,
  androidMenu: {
    en: "Tap ⋮ at the top right of the screen.",
    vi: "Bấm ⋮ ở góc trên bên phải màn hình.",
  } satisfies Text,
  androidAdd: {
    en: "Tap “Install app” or “Add to Home screen”.",
    vi: "Bấm “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.",
  } satisfies Text,

  // Inside Zalo, Facebook or Messenger, which cannot install anything.
  inAppMenu: {
    en: "This page opened inside another app. Tap ⋯ or ⋮ at the top of the screen.",
    vi: "Trang này đang mở bên trong một ứng dụng khác. Hãy bấm ⋯ hoặc ⋮ ở phía trên màn hình.",
  } satisfies Text,
  inAppOpen: {
    en: "Tap “Open in browser” (or “Open in Safari” / “Open in Chrome”), then follow the steps there.",
    vi: "Bấm “Mở bằng trình duyệt” (hoặc “Mở bằng Safari” / “Mở bằng Chrome”), rồi làm theo hướng dẫn ở đó.",
  } satisfies Text,

  // A computer
  onYourPhone: {
    en: "Open this address on your phone to install the app there.",
    vi: "Hãy mở địa chỉ này trên điện thoại để cài ứng dụng.",
  } satisfies Text,
  continueInBrowser: { en: "Continue in this browser", vi: "Tiếp tục trên trình duyệt này" } satisfies Text,

  // The last step everywhere
  openFromHome: {
    en: `Close this page and open ${APP_NAME} from your Home Screen.`,
    vi: `Đóng trang này và mở ${APP_NAME} từ Màn hình chính.`,
  } satisfies Text,
  installedHeading: { en: "Installed", vi: "Đã cài xong" } satisfies Text,
};
