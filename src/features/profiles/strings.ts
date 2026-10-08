import type { Text } from "@/features/i18n/types"; // I18N

// Every word this foundation shows a user, in both languages. Names themselves are data.
export const STRINGS = {
  askName: { en: "What is your name?", vi: "Xin cho biết tên" } satisfies Text,
  whoSeesIt: {
    en: "People in your groups will see it beside what you write.",
    vi: "Những người cùng nhóm sẽ thấy tên này bên cạnh những gì được viết.",
  } satisfies Text,
  nameField: { en: "Name", vi: "Tên" } satisfies Text,
  continue: { en: "Continue", vi: "Tiếp tục" } satisfies Text,

  // Changing a name once in a group: a group manager approves it
  sentForApproval: { en: "Sent for approval", vi: "Đã gửi để chờ duyệt" } satisfies Text,
  waitingForApproval: { en: "Waiting for approval", vi: "Đang chờ duyệt" } satisfies Text,

  // Admin section
  namesWaiting: { en: "Names waiting for approval", vi: "Tên đang chờ duyệt" } satisfies Text,
  currentName: { en: "Now", vi: "Hiện tại" } satisfies Text,
  approve: { en: "Approve", vi: "Duyệt" } satisfies Text,
  approved: { en: "Approved", vi: "Đã duyệt" } satisfies Text,
  decline: { en: "Decline", vi: "Từ chối" } satisfies Text,
  declined: { en: "Declined", vi: "Đã từ chối" } satisfies Text,

  // Notifications (server/notifyName.ts)
  nameChange: { en: "Name change", vi: "Đổi tên" } satisfies Text,
  someoneAsksForName: { en: "Someone is asking to change their name", vi: "Có người xin đổi tên" } satisfies Text,
  nameApproved: { en: "Your new name was approved", vi: "Tên mới đã được duyệt" } satisfies Text,
};
