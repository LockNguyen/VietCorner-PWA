import type { Text } from "./types";

// Words every feature says the same way. One copy, so "Saved" cannot end up worded five ways.
// A feature's own words stay in its own `strings.ts`.
export const COMMON = {
  save: { en: "Save", vi: "Lưu" } satisfies Text,
  saving: { en: "Saving…", vi: "Đang lưu…" } satisfies Text,
  saved: { en: "Saved", vi: "Đã lưu" } satisfies Text,
  removed: { en: "Removed", vi: "Đã xóa" } satisfies Text,
  tapAgain: { en: "Tap again to confirm", vi: "Bấm lần nữa để xác nhận" } satisfies Text, // useConfirmTap
  close: { en: "Close", vi: "Đóng" } satisfies Text,
  // A phone number's choices (src/components/PhoneNumber.tsx), on a group's sheet and an event's page
  call: { en: "Call", vi: "Gọi" } satisfies Text,
  sendText: { en: "Text", vi: "Nhắn tin" } satisfies Text,
  copyNumber: { en: "Copy", vi: "Sao chép" } satisfies Text,
  copied: { en: "Number copied", vi: "Đã chép số điện thoại" } satisfies Text, // the X of every sheet, read by screen readers
  couldNotSave: { en: "Could not save. Please try again.", vi: "Không lưu được. Xin thử lại." } satisfies Text,
};
