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

  // Composer
  bodyPlaceholder: { en: "What can we pray for?", vi: "Bạn cần cầu nguyện cho điều gì?" } satisfies Text,
  shareWith: { en: "Share with", vi: "Chia sẻ với" } satisfies Text,
  postAnonymously: { en: "Hide my name", vi: "Ẩn tên tôi" } satisfies Text,
  postButton: { en: "Share", vi: "Chia sẻ" } satisfies Text,

  // One request
  anonymous: { en: "Anonymous", vi: "Ẩn danh" } satisfies Text,
  you: { en: "you", vi: "bạn" } satisfies Text,
  showMore: { en: "more…", vi: "xem thêm…" } satisfies Text,
  showLess: { en: "less", vi: "thu gọn" } satisfies Text,
  prayButton: { en: "🙏 Pray", vi: "🙏 Cầu nguyện" } satisfies Text,
  prayed: { en: "🙏 Prayed", vi: "🙏 Đã cầu nguyện" } satisfies Text,
  answered: { en: "Answered", vi: "Đã được nhậm lời" } satisfies Text,
  manage: { en: "Options for this request", vi: "Tùy chọn cho lời xin này" } satisfies Text,
  loadingOlder: { en: "Loading…", vi: "Đang tải…" } satisfies Text,

  // The author's options
  markAnswered: { en: "Answered", vi: "Đã được nhậm lời" } satisfies Text,
  deleteRequest: { en: "Delete", vi: "Xóa" } satisfies Text,
  confirmDelete: { en: "Delete this request for good?", vi: "Xóa hẳn lời xin cầu nguyện này?" } satisfies Text,
  cancel: { en: "Cancel", vi: "Hủy" } satisfies Text,
};

// A sentence with a number in it, so it is a function. English has a singular; Vietnamese does not.
export function prayedForYou(count: number): Text {
  return {
    en: count === 1 ? "1 person prayed for you" : `${count} people prayed for you`,
    vi: `${count} người đã cầu nguyện cho bạn`,
  };
}
