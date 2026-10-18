import type { Text } from "@/features/i18n/types"; // I18N
import type { SignInProblem } from "./errors";
import { APP_NAME } from "@/lib/appName";

// Every word this feature shows a user, in both languages. Components read them through
// `useLanguage().t`, so adding a language means editing this file, not the components.
export const STRINGS = {
  // Signed out (components/Welcome.tsx, SignInForm.tsx, SignUpForm.tsx)
  signUpHeading: { en: "Create your account", vi: "Tạo tài khoản" } satisfies Text,
  nameLabel: { en: "Your name", vi: "Tên của bạn" } satisfies Text,
  emailLabel: { en: "Email", vi: "Email" } satisfies Text,
  signInButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  nextButton: { en: "Next", vi: "Tiếp tục" } satisfies Text,
  createNewAccountQuestion: { en: "Create new account?", vi: "Tạo tài khoản mới?" } satisfies Text, // under Sign in, and the banner's link
  working: { en: "Please wait…", vi: "Xin chờ…" } satisfies Text,

  // Waiting for the email's link (components/CheckEmail.tsx)
  emailSent: { en: "Check your email", vi: "Hãy mở email" } satisfies Text,
  openTheLink: { en: "Tap the link in it, then come back here.", vi: "Bấm vào đường dẫn, rồi quay lại đây." } satisfies Text,

  accountHeading: { en: "Account", vi: "Tài khoản" } satisfies Text,
  signedInAs: { en: "Signed in", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,

  // The screen an email's link opens (components/ConfirmLink.tsx)
  // Short on purpose (the user, 2026-10-17): a long sentence is not read.
  confirmPrompt: { en: "Sign in?", vi: "Đăng nhập?" } satisfies Text,
  onlyIfYouAsked: { en: "Only if you just asked to.", vi: "Chỉ bấm nếu bạn vừa yêu cầu." } satisfies Text,
  confirmButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  confirmed: { en: "Done", vi: "Xong" } satisfies Text,
  goBackToTheApp: { en: `Go back to the ${APP_NAME} app.`, vi: `Hãy quay lại ứng dụng ${APP_NAME}.` } satisfies Text,
  linkDidNotWork: { en: "This link has expired", vi: "Đường dẫn đã hết hạn" } satisfies Text,
  askForANewLink: { en: "Ask for a new one in the app.", vi: "Hãy xin đường dẫn mới trong ứng dụng." } satisfies Text,
};

// What to tell someone whose sign-in step failed, keyed by cause (errors.ts decides which applies).
export const PROBLEMS: Record<SignInProblem, Text> = {
  offline: { en: "No internet connection. Check it and try again.", vi: "Không có kết nối mạng. Xin kiểm tra và thử lại." },
  tooMany: {
    en: "Too many tries. Wait a minute, then try again.",
    vi: "Thử quá nhiều lần. Xin chờ một phút rồi thử lại.",
  },
  badEmail: { en: "That email address does not look right. Check it and try again.", vi: "Địa chỉ email chưa đúng. Xin kiểm tra và thử lại." },
  badLink: {
    en: "That link is too old or was already used. Ask for a new one.",
    vi: "Đường dẫn đã cũ hoặc đã được dùng. Xin đường dẫn mới.",
  },
  // Ends with a link in the banner: "Create new account?".
  noAccount: { en: "Account not created yet.", vi: "Tài khoản chưa được tạo." },
  other: { en: "Something went wrong. Please try again.", vi: "Có lỗi xảy ra. Xin thử lại." },
};
