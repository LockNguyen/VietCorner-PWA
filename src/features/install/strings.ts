import type { Text } from "@/features/i18n/types"; // I18N
import { APP_NAME } from "@/lib/appName";

// Every word this feature shows a user, in both languages. Menu names are quoted as the phone shows them.
// Short on purpose (the user, 2026-10-17): the grey circle beside each line shows the button itself.
export const STRINGS = {
  heading: { en: `Put ${APP_NAME} on your phone`, vi: `Cài ${APP_NAME} vào điện thoại` } satisfies Text,

  // iPhone and iPad: Safari has no install button a web page can press, so the steps are told.
  iphoneMore: { en: "Tap ••• at the bottom", vi: "Nhấn ••• ở phía dưới màn hình" } satisfies Text, // iOS 26 only
  iphoneShare: { en: "Tap Share", vi: "Nhấn chọn “Chia sẻ”" } satisfies Text,
  iphoneAdd: { en: "Tap “Add to Home Screen”", vi: "Nhấn “Thêm vào Màn hình chính”" } satisfies Text,
  iphoneConfirm: { en: "Tap “Add”", vi: "Nhấn “Thêm”" } satisfies Text,
  addWord: { en: "Add", vi: "Thêm" } satisfies Text, // inside the last circle, as the phone writes it

  // Android: Chrome's own dialog when it offers one, otherwise its menu.
  installButton: { en: "Install the app", vi: "Cài đặt ứng dụng" } satisfies Text,
  androidMenu: { en: "Tap ⋮ at the top", vi: "Nhấn vào biểu tượng ⋮ ở góc trên" } satisfies Text,
  androidAdd: { en: "Tap “Install app”", vi: "Bấm “Cài đặt ứng dụng”" } satisfies Text,

  // Inside Zalo, Facebook or Messenger, which cannot install anything.
  inAppMenu: { en: "Tap ⋯ or ⋮ at the top", vi: "Nhấn vào biểu tượng ⋯ hoặc ⋮ ở góc trên" } satisfies Text,
  inAppOpen: { en: "Tap “Open in browser”", vi: "Bấm “Mở bằng trình duyệt”" } satisfies Text,

  // A computer: the only place the guide can be skipped.
  onYourPhone: {
    en: "Open this address on your phone to install the app there.",
    vi: "Vui lòng mở địa chỉ này trên điện thoại để tiến hành cài đặt ứng dụng.",
  } satisfies Text,
  continueInBrowser: { en: "Continue in this browser", vi: "Tiếp tục trên trình duyệt này" } satisfies Text,

  // After the steps
  openFromHome: {
    en: `Then open ${APP_NAME} from your Home Screen.`,
    vi: `Sau đó, bạn có thể mở ứng dụng ${APP_NAME} trực tiếp từ Màn hình chính.`,
  } satisfies Text,
  installedHeading: { en: "Installed", vi: "Đã cài đặt thành công" } satisfies Text,
};
