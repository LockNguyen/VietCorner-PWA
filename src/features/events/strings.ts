import type { Text } from "@/features/i18n/types"; // I18N
import type { DraftProblem } from "./draft";

// Every word this feature shows a user, in both languages. Event titles are not here: those are data an
// admin writes, and they live in `event_texts`.
export const STRINGS = {
  // The event's picture (admin editor)
  pictureHeading: { en: "Picture", vi: "Hình ảnh" } satisfies Text,
  choosePicture: { en: "Choose picture", vi: "Chọn hình ảnh" } satisfies Text,
  changePicture: { en: "Change picture", vi: "Chọn hình khác" } satisfies Text,
  removePicture: { en: "Remove picture", vi: "Xóa hình ảnh" } satisfies Text,

  emptyState: {
    en: "No events in the next weeks.",
    vi: "Không có sự kiện nào trong vài tuần tới.",
  } satisfies Text,
  canceled: { en: "Cancelled", vi: "Đã hủy" } satisfies Text,
  today: { en: "Today", vi: "Hôm nay" } satisfies Text,
  tomorrow: { en: "Tomorrow", vi: "Ngày mai" } satisfies Text,
  everyWeek: { en: "Every week", vi: "Hằng tuần" } satisfies Text,
  location: { en: "Location", vi: "Địa điểm" } satisfies Text,
  contact: { en: "Contact", vi: "Liên hệ" } satisfies Text,
  addressField: { en: "Address", vi: "Địa chỉ" } satisfies Text,
  contactField: { en: "Contact phone number", vi: "Số điện thoại liên hệ" } satisfies Text,

  // The editor (for whoever manages events)
  newEvent: { en: "New event", vi: "Sự kiện mới" } satisfies Text,
  editEvent: { en: "Edit event", vi: "Chỉnh sửa sự kiện" } satisfies Text,
  nextDates: { en: "Next dates", vi: "Các buổi sắp tới" } satisfies Text,
  cancelThisDate: { en: "Cancel", vi: "Hủy" } satisfies Text,
  undoCancel: { en: "Undo", vi: "Hoàn tác" } satisfies Text,
  cancelForGood: { en: "Cancel all event dates", vi: "Hủy toàn bộ các buổi" } satisfies Text,

  // The form
  titleField: { en: "Title", vi: "Tên sự kiện" } satisfies Text,
  // Under each field of the editor: where it shows on the card (the user, 2026-10-20).
  titleHint: { en: "The bold line: “Worship”, “Sunday School”.", vi: "Dòng chữ đậm: “Thờ Phượng”, “Trường Chúa Nhật”." } satisfies Text,
  locationHint: {
    en: "The place's name. Same day, same place, address and number: one card, with this as its title.",
    vi: "Tên nơi họp. Cùng ngày, cùng địa điểm, địa chỉ và số điện thoại: chung một thẻ, tên này làm tựa.",
  } satisfies Text,
  firstDateHint: {
    en: "Every week: the first date. The card shows the next one; the coming dates are at the bottom.",
    vi: "Hằng tuần: ngày của buổi đầu tiên. Thẻ hiện buổi kế tiếp; các buổi sắp tới ở cuối trang.",
  } satisfies Text,
  addressHint: { en: "Tapping it opens Google Maps or Apple Maps.", vi: "Bấm vào để mở Google Maps hoặc Apple Maps." } satisfies Text,
  contactHint: { en: "Tapping it calls, texts or copies.", vi: "Bấm vào để gọi, nhắn tin hoặc sao chép." } satisfies Text,
  startsField: { en: "Starts", vi: "Bắt đầu" } satisfies Text,
  endsField: { en: "Ends (optional)", vi: "Kết thúc (nếu có)" } satisfies Text,
  repeatUntilField: { en: "Repeat until (optional)", vi: "Lặp lại đến ngày (nếu có)" } satisfies Text,

  remindersHeading: { en: "Remind members", vi: "Nhắc nhở Hội Thánh" } satisfies Text,

  // The notification members get (server/notifyScheduleChange.ts): "Cancelled: <when>" or "Back on: <when>"
  backOn: { en: "Back on", vi: "Diễn ra trở lại" } satisfies Text,
  untilFurtherNotice: { en: "until further notice", vi: "cho đến khi có thông báo mới" } satisfies Text,
};

// Why the form cannot be saved yet, keyed by cause (draft.ts decides which applies).
export const PROBLEMS: Record<DraftProblem, Text> = {
  noTitle: { en: "Add a title in at least one language.", vi: "Vui lòng nhập tên sự kiện." },
  noStart: { en: "Choose when it starts.", vi: "Vui lòng chọn thời điểm bắt đầu." },
  endsBeforeItStarts: { en: "The end must be after the start.", vi: "Giờ kết thúc phải sau giờ bắt đầu." },
};

// The reminder choices, by minutes before the event (REMINDER_CHOICES in types.ts).
export const REMINDER_LABELS: Record<number, Text> = {
  1440: { en: "1 day before", vi: "Trước 1 ngày" },
  120: { en: "2 hours before", vi: "Trước 2 giờ" },
  30: { en: "30 minutes before", vi: "Trước 30 phút" },
};
