import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Group names are data, not labels.
export const STRINGS = {
  joinButton: { en: "Join", vi: "Tham gia" } satisfies Text,
  pending: { en: "Waiting for approval", vi: "Đang chờ duyệt" } satisfies Text,
  joined: { en: "Joined", vi: "Đã tham gia" } satisfies Text,
  noGroups: { en: "There are no groups yet.", vi: "Chưa có nhóm nào." } satisfies Text,

  // Admin section
  adminHeading: { en: "Groups", vi: "Nhóm" } satisfies Text,
  groupName: { en: "Group name", vi: "Tên nhóm" } satisfies Text,
  newGroup: { en: "New group", vi: "Nhóm mới" } satisfies Text,
  createGroup: { en: "Create group", vi: "Tạo nhóm" } satisfies Text,
  removeGroup: { en: "Remove this group", vi: "Gỡ bỏ nhóm này" } satisfies Text,
  pictureHeading: { en: "Picture", vi: "Hình" } satisfies Text,
  choosePicture: { en: "Choose a picture", vi: "Chọn hình" } satisfies Text,
  changePicture: { en: "Choose another picture", vi: "Chọn hình khác" } satisfies Text,
  removePicture: { en: "Remove the picture", vi: "Gỡ hình" } satisfies Text,
  peopleHeading: { en: "In the app", vi: "Trong ứng dụng" } satisfies Text,
  nobodyYet: { en: "Nobody yet.", vi: "Chưa có ai." } satisfies Text,
  addPersonField: { en: "Add a person", vi: "Thêm người" } satisfies Text,
  choosePerson: { en: "Choose a person", vi: "Chọn một người" } satisfies Text,
  addPerson: { en: "Add", vi: "Thêm" } satisfies Text,
  added: { en: "Added", vi: "Đã thêm" } satisfies Text,
  removePerson: { en: "Remove", vi: "Gỡ" } satisfies Text,
  noGroup: { en: "Has no group", vi: "Chưa vào nhóm" } satisfies Text,
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

// "12 members" under a group's name. A phrase with a number in it, so it is a function.
export function members(count: number): Text {
  return { en: count === 1 ? "1 member" : `${count} members`, vi: `${count} thành viên` };
}
