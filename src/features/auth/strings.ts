// Every word this feature shows a user, in one place.
//
// Why: when the i18n feature lands, these values become { en, vi } lookups and no component changes.
// Components import STRINGS instead of writing text inline. `codeSentTo` is a function because it takes
// the email; that is the shape a translation lookup will have too.
//
// Until i18n exists, each value is the bilingual string the user sees today.

export const STRINGS = {
  emailLabel: "Email",
  sendCodeButton: "Gửi mã cho tôi / Send me a code",
  codeSentTo: (email: string) => `Nhập mã đã gửi tới ${email} / Enter the code sent to ${email}`,
  signInButton: "Đăng nhập / Sign in",
  useAnotherEmail: "Dùng email khác / Use a different email",
  signedInAs: "Đã đăng nhập / Signed in as",
  signOutButton: "Đăng xuất / Sign out",
};
