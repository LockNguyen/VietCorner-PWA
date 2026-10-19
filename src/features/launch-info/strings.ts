import type { Text } from "@/features/i18n/types"; // I18N

// Every word of the panel, in both languages. Only admins see it.
export const STRINGS = {
  open: { en: "Launch times", vi: "Thời gian mở ứng dụng" } satisfies Text,
  title: { en: "For developers: this launch", vi: "Cho lập trình viên: lần mở này" } satisfies Text,
  homeFrom: { en: "Home came from", vi: "Trang chủ lấy từ" } satisfies Text,
  savedCopy: { en: "Saved copy", vi: "Bản đã lưu" } satisfies Text,
  server: { en: "Server", vi: "Máy chủ" } satisfies Text,
  pageArrived: { en: "Page arrived", vi: "Trang đến" } satisfies Text,
  pageArrivedHint: { en: "Server and network, or the saved copy", vi: "Máy chủ và mạng, hoặc bản đã lưu" } satisfies Text,
  filesRead: { en: "Code files read", vi: "Đã đọc các tệp mã" } satisfies Text,
  tappable: { en: "Ready to tap", vi: "Sẵn sàng để chạm" } satisfies Text,
  allLoaded: { en: "Everything loaded", vi: "Đã tải xong mọi thứ" } satisfies Text,
  filesSaved: { en: "Code files from the saved copy", vi: "Tệp mã lấy từ bản đã lưu" } satisfies Text,
  filesDownloaded: { en: "Code files downloaded", vi: "Tệp mã tải về" } satisfies Text,
  note: {
    en: "Counted from when the phone starts loading the page. The black screen before that is iOS starting the app, which a web page cannot see.",
    vi: "Tính từ lúc điện thoại bắt đầu tải trang. Màn hình đen trước đó là iOS đang mở ứng dụng, trang web không đo được.",
  } satisfies Text,
};
