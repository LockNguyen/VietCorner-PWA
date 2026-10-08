import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Group names are data, not labels.
export const STRINGS = {
  joinButton: { en: "Join", vi: "Tham gia" } satisfies Text,
  pending: { en: "Waiting for approval", vi: "Đang chờ duyệt" } satisfies Text,
  joined: { en: "Joined", vi: "Đã tham gia" } satisfies Text,
  noGroups: { en: "There are no groups yet.", vi: "Chưa có nhóm nào." } satisfies Text,

  // Admin section
  adminHeading: { en: "Groups", vi: "Nhóm" } satisfies Text,
  newGroupField: { en: "Name of the new group", vi: "Tên nhóm mới" } satisfies Text,
  groupName: { en: "Group name", vi: "Tên nhóm" } satisfies Text,
  addGroup: { en: "Add group", vi: "Thêm nhóm" } satisfies Text,
  removeGroup: { en: "Remove", vi: "Gỡ bỏ" } satisfies Text,
  requestSent: { en: "Request sent", vi: "Đã gửi yêu cầu" } satisfies Text,
  approved: { en: "Approved", vi: "Đã duyệt" } satisfies Text,
  declined: { en: "Declined", vi: "Đã từ chối" } satisfies Text,
  requestsHeading: { en: "Waiting to join", vi: "Đang chờ tham gia" } satisfies Text,
  approve: { en: "Approve", vi: "Duyệt" } satisfies Text,
  decline: { en: "Decline", vi: "Từ chối" } satisfies Text,

  // Notifications (server/notifyJoin.ts). The group's name is the title.
  someoneWantsToJoin: { en: "Someone is asking to join", vi: "Có người xin tham gia" } satisfies Text,
  youHaveJoined: { en: "You have been let in", vi: "Bạn đã được duyệt vào nhóm" } satisfies Text,
};
