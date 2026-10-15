import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages.
export const STRINGS = {
  // The screen a new account sees until an admin approves it
  waiting: { en: "Waiting for approval", vi: "Đang chờ duyệt" } satisfies Text,
  whatHappensNext: {
    en: "A church admin will let you in soon. You will not need to sign in again.",
    vi: "Ban quản trị hội thánh sẽ sớm duyệt tài khoản. Không cần đăng nhập lại.",
  } satisfies Text,
  turnOnToBeTold: {
    en: "We will send you a notification as soon as you are let in (notifications must be on, below).",
    vi: "Chúng tôi sẽ gửi thông báo ngay khi tài khoản được duyệt (cần bật thông báo ở dưới).",
  } satisfies Text,
  checkAgain: { en: "Check again", vi: "Kiểm tra lại" } satisfies Text,

  // Admin section
  accountsWaiting: { en: "People waiting to be let in", vi: "Người đang chờ được duyệt" } satisfies Text,
  approve: { en: "Approve", vi: "Duyệt" } satisfies Text,
  approved: { en: "Approved", vi: "Đã duyệt" } satisfies Text,

  // Notifications (server/notifyApproval.ts)
  newAccount: { en: "New sign-up", vi: "Đăng ký mới" } satisfies Text,
  youAreIn: { en: "You have been approved. Welcome!", vi: "Tài khoản đã được duyệt. Chào mừng!" } satisfies Text,
};

// The body of the notification an admin gets. A sentence with a name in it, so it is a function.
export function isWaiting(name: string): Text {
  return { en: `${name} is waiting to be let in`, vi: `${name} đang chờ được duyệt` };
}
