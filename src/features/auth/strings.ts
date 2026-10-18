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
  haveAccount: { en: "I already have an account", vi: "Tôi đã có tài khoản" } satisfies Text,
  working: { en: "Please wait…", vi: "Xin chờ…" } satisfies Text,

  // Waiting for the email's link (components/CheckEmail.tsx)
  linkSentTo: { en: "We sent an email to", vi: "Đã gửi email tới" } satisfies Text,
  openTheLink: {
    en: "Open the email and tap the link, then come back here. This screen will go on by itself.",
    vi: "Hãy mở email và bấm vào đường dẫn, rồi quay lại đây. Màn hình này sẽ tự tiếp tục.",
  } satisfies Text,
  checkSpam: {
    en: "Not there after a few minutes? Look in Spam or Junk.",
    vi: "Vài phút vẫn chưa thấy? Hãy xem trong mục Thư rác (Spam).",
  } satisfies Text,
  useAnotherEmail: { en: "Start again", vi: "Làm lại từ đầu" } satisfies Text,

  accountHeading: { en: "Account", vi: "Tài khoản" } satisfies Text,
  signedInAs: { en: "Signed in", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,

  // The screen an email's link opens (components/ConfirmLink.tsx)
  confirmPrompt: { en: `Sign in to ${APP_NAME}?`, vi: `Đăng nhập vào ${APP_NAME}?` } satisfies Text,
  onlyIfYouAsked: {
    en: `Tap the button only if you just asked to sign in, in the ${APP_NAME} app.`,
    vi: `Chỉ bấm nút nếu bạn vừa yêu cầu đăng nhập trong ứng dụng ${APP_NAME}.`,
  } satisfies Text,
  confirmButton: { en: "Yes, sign me in", vi: "Đồng ý, đăng nhập" } satisfies Text,
  confirmed: { en: "Done", vi: "Xong" } satisfies Text,
  goBackToTheApp: {
    en: `Now go back to the ${APP_NAME} app. You will be signed in.`,
    vi: `Bây giờ hãy quay lại ứng dụng ${APP_NAME}. Bạn sẽ được đăng nhập.`,
  } satisfies Text,
  linkDidNotWork: { en: "This link did not work", vi: "Đường dẫn này không dùng được" } satisfies Text,
  askForANewLink: {
    en: `It is too old or was already used. Go back to the ${APP_NAME} app and ask for a new one.`,
    vi: `Đường dẫn đã cũ hoặc đã được dùng. Hãy quay lại ứng dụng ${APP_NAME} và xin đường dẫn mới.`,
  } satisfies Text,
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
