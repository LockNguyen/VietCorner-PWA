import type { Text } from "@/features/i18n/types"; // I18N

// Text belonging to the app shell itself (tabs and page titles), rather than to any one feature.
export const SHELL_STRINGS = {
  groupsTab: { en: "Groups", vi: "Nhóm" } satisfies Text,
  eventsTab: { en: "Events", vi: "Sự kiện" } satisfies Text,
  prayerTab: { en: "Prayer", vi: "Cầu nguyện" } satisfies Text,
  assistantTab: { en: "Assistant", vi: "Trợ lý" } satisfies Text,
  settingsTab: { en: "Settings", vi: "Cài đặt" } satisfies Text,
  adminTab: { en: "Admin", vi: "Quản trị" } satisfies Text,
  signInTitle: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
};
