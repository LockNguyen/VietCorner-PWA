import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. Components read them through
// `useLanguage().t`, so adding a language means editing this file, not the components.
export const STRINGS = {
  emailLabel: { en: "Email", vi: "Email" } satisfies Text,
  sendCodeButton: { en: "Send me a code", vi: "Gửi mã cho tôi" } satisfies Text,
  sendingCode: { en: "Sending…", vi: "Đang gửi…" } satisfies Text,
  signInButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  signingIn: { en: "Signing in…", vi: "Đang đăng nhập…" } satisfies Text,
  useAnotherEmail: { en: "Use a different email", vi: "Dùng email khác" } satisfies Text,
  signedInAs: { en: "Signed in as", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,
  codeSentTo: {
    en: "Enter the code sent to",
    vi: "Nhập mã đã gửi tới",
  } satisfies Text,
};
