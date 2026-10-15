import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages (the role names are in types.ts, beside the roles).
export const STRINGS = {
  heading: { en: "People", vi: "Mọi người" } satisfies Text,
  rolesHeading: { en: "What they may do", vi: "Quyền" } satisfies Text,
  waiting: { en: "Waiting to be let in", vi: "Đang chờ duyệt" } satisfies Text,
  member: { en: "Member", vi: "Thành viên" } satisfies Text,
  admin: { en: "Admin", vi: "Quản trị viên" } satisfies Text,
  remove: { en: "Remove this person", vi: "Xóa người này" } satisfies Text,
  removed: { en: "Removed", vi: "Đã xóa" } satisfies Text,
  nobody: { en: "Nobody has signed up yet.", vi: "Chưa có ai đăng ký." } satisfies Text,
};

// "2 groups" under a person's name.
export function groupCount(count: number): Text {
  return { en: count === 1 ? "1 group" : `${count} groups`, vi: `${count} nhóm` };
}
