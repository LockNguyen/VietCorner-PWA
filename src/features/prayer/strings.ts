import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. The requests themselves are not here: members
// write those, and they are shown as written.
export const STRINGS = {
  noGroups: {
    en: "Join a group first. Prayer requests are shared inside a group.",
    vi: "Xin tham gia một nhóm trước. Lời xin cầu nguyện được chia sẻ trong nhóm.",
  } satisfies Text,
  emptyState: { en: "No prayer requests yet.", vi: "Chưa có lời xin cầu nguyện nào." } satisfies Text,
  failed: { en: "Something went wrong. Please try again.", vi: "Có lỗi xảy ra. Xin thử lại." } satisfies Text,
  shared: { en: "Shared", vi: "Đã chia sẻ" } satisfies Text,
  deleted: { en: "Deleted", vi: "Đã xóa" } satisfies Text,

  // Composer
  addRequest: { en: "New prayer request", vi: "Lời xin cầu nguyện mới" } satisfies Text,
  bodyPlaceholder: { en: "What can we pray for?", vi: "Bạn cần cầu nguyện cho điều gì?" } satisfies Text,
  shareWith: { en: "Share with", vi: "Chia sẻ với" } satisfies Text,
  postAnonymously: { en: "Hide my name", vi: "Ẩn tên tôi" } satisfies Text,
  postButton: { en: "Share", vi: "Chia sẻ" } satisfies Text,

  // The weeks the list is divided into
  thisWeek: { en: "This week", vi: "Tuần này" } satisfies Text,
  lastWeek: { en: "Last week", vi: "Tuần trước" } satisfies Text,
  weekOf: { en: "Week of", vi: "Tuần bắt đầu ngày" } satisfies Text,

  // One request
  anonymous: { en: "Anonymous", vi: "Ẩn danh" } satisfies Text,
  you: { en: "you", vi: "bạn" } satisfies Text,
  prayButton: { en: "Pray", vi: "Cầu nguyện" } satisfies Text,
  prayed: { en: "Prayed", vi: "Đã cầu nguyện" } satisfies Text,
  manage: { en: "Options for this request", vi: "Tùy chọn cho lời xin này" } satisfies Text,
  yourWords: { en: "Your request", vi: "Lời xin của bạn" } satisfies Text,
  loadingOlder: { en: "Loading…", vi: "Đang tải…" } satisfies Text,

  // The author's options
  markAnswered: { en: "Answered", vi: "Đã được nhậm lời" } satisfies Text,
  editRequest: { en: "Edit", vi: "Sửa" } satisfies Text,
  deleteRequest: { en: "Delete", vi: "Xóa" } satisfies Text,
  cancel: { en: "Cancel", vi: "Hủy" } satisfies Text,

  // Admin section: when each group is reminded to pray
  remindersHeading: { en: "Prayer reminders", vi: "Nhắc cầu nguyện" } satisfies Text,
  groupField: { en: "Group", vi: "Nhóm" } satisfies Text,
  dayField: { en: "Day", vi: "Ngày" } satisfies Text,
  timeField: { en: "Time (church time)", vi: "Giờ (giờ hội thánh)" } satisfies Text,
  addReminder: { en: "Add reminder", vi: "Thêm lời nhắc" } satisfies Text,
  removeReminder: { en: "Remove", vi: "Gỡ bỏ" } satisfies Text,
  reminderExists: {
    en: "That group already has a reminder at that day and time.",
    vi: "Nhóm này đã có lời nhắc vào ngày và giờ đó.",
  } satisfies Text,
  // The notification a group gets at that time (server/sendDueReminders.ts). The group's name is the title.
  timeToPray: { en: "Time to pray together", vi: "Đến giờ cùng nhau cầu nguyện" } satisfies Text,

  // The notification an author gets (server/notifyAuthor.ts)
  notificationTitle: { en: "Prayer", vi: "Cầu nguyện" } satisfies Text,
};

// The label of a week two or three back. A sentence with a number in it, so it is a function.
export function weeksAgo(count: number): Text {
  return { en: `${count} weeks ago`, vi: `${count} tuần trước` };
}

// The body of that notification. A sentence with a number in it, so it is a function. English has a
// singular; Vietnamese does not. The number counts prayers: one person praying twice is "2 people".
export function prayedForYou(count: number): Text {
  return {
    en: count === 1 ? "1 person prayed for you" : `${count} people prayed for you`,
    vi: `${count} người đã cầu nguyện cho bạn`,
  };
}
