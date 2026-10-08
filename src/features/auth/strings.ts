import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Components read them through
// `useLanguage().t`, so adding a language means editing this file, not the components.
export const STRINGS = {
  emailPrompt: { en: "Enter your email to get a sign-in code", vi: "Nhập email để nhận mã đăng nhập" } satisfies Text,
  codeLabel: { en: "Code", vi: "Mã" } satisfies Text,
  couldNotSendCode: {
    en: "Could not send the code. Check the email address and try again.",
    vi: "Không gửi được mã. Xin kiểm tra địa chỉ email và thử lại.",
  } satisfies Text,
  wrongCode: {
    en: "That code did not work. Check it, or ask for a new one.",
    vi: "Mã không đúng hoặc đã hết hạn. Xin kiểm tra lại, hoặc xin mã mới.",
  } satisfies Text,
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
