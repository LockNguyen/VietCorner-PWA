import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Group names are data, not labels.
export const STRINGS = {
  joinButton: { en: "Join", vi: "Tham gia" } satisfies Text,

  // Admin section
  adminHeading: { en: "Groups", vi: "Nhóm" } satisfies Text,
  newGroupPlaceholder: { en: "Name of the new group", vi: "Tên nhóm mới" } satisfies Text,
  addGroup: { en: "Add group", vi: "Thêm nhóm" } satisfies Text,
  saveName: { en: "Save", vi: "Lưu" } satisfies Text,
  couldNotSave: { en: "Could not save. Please try again.", vi: "Không lưu được. Xin thử lại." } satisfies Text,
};
