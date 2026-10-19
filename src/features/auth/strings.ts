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
  working: { en: "Please wait…", vi: "Đang xử lý..." } satisfies Text,

  // Waiting for the email's link (components/CheckEmail.tsx)
  emailSent: { en: "Check your email", vi: "Hãy kiểm tra hộp thư" } satisfies Text,
  openTheLink: { en: "Tap the link in it, then come back here.", vi: "Nhấn vào đường dẫn trong email để tiếp tục." } satisfies Text,

  accountHeading: { en: "Account", vi: "Tài khoản" } satisfies Text,
  signedInAs: { en: "Signed in", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,

  // The screen an email's link opens (components/ConfirmLink.tsx)
  // Short on purpose (the user, 2026-10-17): a long sentence is not read.
  confirmPrompt: { en: "Sign in?", vi: "Đăng nhập?" } satisfies Text,
  onlyIfYouAsked: { en: "Only if you just asked to.", vi: "Chỉ nhấn nếu bạn vừa yêu cầu đăng nhập." } satisfies Text,
  confirmButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  confirmed: { en: "Done", vi: "Xong" } satisfies Text,
  goBackToTheApp: { en: `Go back to the ${APP_NAME} app.`, vi: `Hãy quay lại ứng dụng ${APP_NAME}.` } satisfies Text,
  linkDidNotWork: { en: "This link has expired", vi: "Đường dẫn đã hết hạn" } satisfies Text,
  askForANewLink: { en: "Ask for a new one in the app.", vi: "Vui lòng đăng nhập lại trong ứng dụng." } satisfies Text,
};

// What to tell someone whose sign-in step failed, keyed by cause (errors.ts decides which applies).
export const PROBLEMS: Record<SignInProblem, Text> = {
  offline: { en: "No internet connection. Check it and try again.", vi: "Không có kết nối mạng. Bạn có đang sử dụng Wi-fi hoặc mạng 3G không?" },
  tooMany: {
    en: "Too many tries. Wait a minute, then try again.",
    vi: "Nút bị nhấn quá nhiều lần. Xin vui lòng chờ một phút rồi thử lại.",
  },
  badEmail: { en: "That email address does not look right. Check it and try again.", vi: "Địa chỉ email không hợp lệ. Xin vui lòng kiểm tra lại email." },
  badLink: {
    en: "That link is too old or was already used. Ask for a new one.",
    vi: "Đường link này đã hết hạn. Xin vui lòng đăng nhập lại trong ứng dụng.",
  },
  // Ends with a link in the banner: "Create new account?".
  noAccount: { en: "Account not created yet.", vi: "Bạn chưa có tài khoản." },
  other: { en: "Something went wrong. Please try again.", vi: "Đã xảy ra lỗi. Xin vui lòng thử lại." },
};
