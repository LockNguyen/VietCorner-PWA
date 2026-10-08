import type { Text } from "@/features/i18n/types"; // I18N
import type { SignInProblem } from "./errors";

// Every word this feature shows a user, in both languages. Components read them through
// `useLanguage().t`, so adding a language means editing this file, not the components.
export const STRINGS = {
  emailPrompt: { en: "Enter your email to get a sign-in code", vi: "Nhập email để nhận mã đăng nhập" } satisfies Text,
  codeLabel: { en: "Code", vi: "Mã" } satisfies Text,
  emailLabel: { en: "Email", vi: "Email" } satisfies Text,
  sendCodeButton: { en: "Send me a code", vi: "Gửi mã cho tôi" } satisfies Text,
  sendingCode: { en: "Sending…", vi: "Đang gửi…" } satisfies Text,
  signInButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  signingIn: { en: "Signing in…", vi: "Đang đăng nhập…" } satisfies Text,
  useAnotherEmail: { en: "Use a different email", vi: "Dùng email khác" } satisfies Text,
  accountHeading: { en: "Account", vi: "Tài khoản" } satisfies Text,
  signedInAs: { en: "Signed in", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,
  codeSentTo: {
    en: "Enter the code sent to",
    vi: "Nhập mã đã gửi tới",
  } satisfies Text,
};

// What to tell someone whose sign-in step failed, keyed by cause (errors.ts decides which applies).
export const PROBLEMS: Record<SignInProblem, Text> = {
  offline: { en: "No internet connection. Check it and try again.", vi: "Không có kết nối mạng. Xin kiểm tra và thử lại." },
  tooMany: {
    en: "Too many tries. Wait a minute, then ask for a new code.",
    vi: "Thử quá nhiều lần. Xin chờ một phút rồi xin mã mới.",
  },
  badEmail: { en: "That email address does not look right. Check it and try again.", vi: "Địa chỉ email chưa đúng. Xin kiểm tra và thử lại." },
  badCode: {
    en: "That code is wrong or has expired. Check it, or ask for a new one.",
    vi: "Mã không đúng hoặc đã hết hạn. Xin kiểm tra lại, hoặc xin mã mới.",
  },
  other: { en: "Something went wrong. Please try again.", vi: "Có lỗi xảy ra. Xin thử lại." },
};
