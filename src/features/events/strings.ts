import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Event titles are not here: those are data an
// admin writes, and they live in `event_texts`.
export const STRINGS = {
  emptyState: {
    en: "No events in the next weeks.",
    vi: "Không có sự kiện nào trong vài tuần tới.",
  } satisfies Text,
  canceled: { en: "Cancelled", vi: "Đã hủy" } satisfies Text,
  today: { en: "Today", vi: "Hôm nay" } satisfies Text,
  tomorrow: { en: "Tomorrow", vi: "Ngày mai" } satisfies Text,
  groupOnly: { en: "Group event", vi: "Sự kiện của nhóm" } satisfies Text,
  everyWeek: { en: "Every week", vi: "Hằng tuần" } satisfies Text,
  location: { en: "Location", vi: "Địa điểm" } satisfies Text,
  close: { en: "Close", vi: "Đóng" } satisfies Text,
};
