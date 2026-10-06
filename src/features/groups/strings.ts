import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Group names are data, not labels.
export const STRINGS = {
  joinButton: { en: "Ask to join", vi: "Xin tham gia" } satisfies Text,
  pending: { en: "Waiting for approval", vi: "Đang chờ duyệt" } satisfies Text,

  // Admin section
  adminHeading: { en: "Groups", vi: "Nhóm" } satisfies Text,
  newGroupPlaceholder: { en: "Name of the new group", vi: "Tên nhóm mới" } satisfies Text,
  addGroup: { en: "Add group", vi: "Thêm nhóm" } satisfies Text,
  saveName: { en: "Save", vi: "Lưu" } satisfies Text,
  removeGroup: { en: "Remove", vi: "Gỡ bỏ" } satisfies Text,
  couldNotSave: { en: "Could not save. Please try again.", vi: "Không lưu được. Xin thử lại." } satisfies Text,
  requestsHeading: { en: "Waiting to join", vi: "Đang chờ tham gia" } satisfies Text,
  approve: { en: "Approve", vi: "Duyệt" } satisfies Text,
  decline: { en: "Decline", vi: "Từ chối" } satisfies Text,

  // Notifications (server/notifyJoin.ts). The group's name is the title.
  someoneWantsToJoin: { en: "Someone is asking to join", vi: "Có người xin tham gia" } satisfies Text,
  youHaveJoined: { en: "You have been let in", vi: "Bạn đã được duyệt vào nhóm" } satisfies Text,
};
