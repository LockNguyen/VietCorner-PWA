import type { Text } from "@/features/i18n/types"; // I18N

// One row of `people_list()` (schema.sql): an account as the Admin tab lists it.
export type PersonSummary = {
  user_id: string;
  name: string;
  email: string;
  signed_up_at: string;
  roles: string[]; // what they may do (ROLES below); none = signed up, not let in yet
  group_ids: string[]; // the active groups they are in
  avatar_path: string | null; // their picture in the profiles' AVATAR_BUCKET; null = the default figure
};

// The permission this feature checks (schema.sql gives it to "admin").
export const MANAGE_USERS = "users.manage";

// The roles an admin can give or take, in the order shown, each with what it means (schema.sql, section 2;
// set_person_role refuses any other). "admin" holds every permission.
export const ROLES: { role: string; label: Text }[] = [
  { role: "member", label: { en: "Can use the app", vi: "Được dùng ứng dụng" } },
  { role: "events-manager", label: { en: "Manages events", vi: "Quản lý sự kiện" } },
  { role: "groups-manager", label: { en: "Manages groups", vi: "Quản lý nhóm" } },
  { role: "prayer-reminders", label: { en: "Sets prayer reminders", vi: "Đặt nhắc cầu nguyện" } },
  { role: "approver", label: { en: "Approves new accounts", vi: "Duyệt tài khoản mới" } },
  { role: "admin", label: { en: "Admin (everything)", vi: "Quản trị viên (mọi quyền)" } },
];
