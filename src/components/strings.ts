import type { Text } from "@/features/i18n/types"; // I18N

// Text belonging to the app shell itself (tabs and page titles), rather than to any one feature.
export const SHELL_STRINGS = {
  homeTab: { en: "Home", vi: "Trang chủ" } satisfies Text,
  back: { en: "Back", vi: "Quay lại" } satisfies Text,
  groupsTab: { en: "Groups", vi: "Nhóm nhỏ" } satisfies Text,
  eventsTab: { en: "Events", vi: "Lịch sinh hoạt" } satisfies Text,
  eventsTabShort: { en: "Events", vi: "Lịch" } satisfies Text, // the tab bar, when "Lịch sinh hoạt" would not fit (AppTabs)
  prayerTab: { en: "Prayer", vi: "Cầu nguyện" } satisfies Text,
  assistantTab: { en: "Assistant", vi: "Trợ lý" } satisfies Text,
  settingsTab: { en: "Settings", vi: "Cài đặt" } satisfies Text,
  adminTab: { en: "Admin", vi: "Quản trị" } satisfies Text,
  signInTitle: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  close: { en: "Close", vi: "Đóng" } satisfies Text,
  setupStep: { en: "Step", vi: "Bước" } satisfies Text, // "Step 3 / 7" above the setup screens

};
