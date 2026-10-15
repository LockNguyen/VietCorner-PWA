import type { Text } from "@/features/i18n/types"; // I18N
import type { SignInProblem } from "./errors";
import { APP_NAME } from "@/lib/appName";

// Every word this feature shows a user, in both languages. Components read them through
// `useLanguage().t`, so adding a language means editing this file, not the components.
export const STRINGS = {
  // Signed out (components/Welcome.tsx, SignInForm.tsx, SignUpForm.tsx)
  signInHeading: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  signUpHeading: { en: "Create your account", vi: "Tạo tài khoản" } satisfies Text,
  nameLabel: { en: "Your name", vi: "Tên của bạn" } satisfies Text,
  emailLabel: { en: "Email", vi: "Email" } satisfies Text,
  passwordLabel: { en: "Password", vi: "Mật khẩu" } satisfies Text,
  newPasswordLabel: {
    en: "Choose a password (at least 6 letters or numbers)",
    vi: "Chọn mật khẩu (ít nhất 6 chữ hoặc số)",
  } satisfies Text,
  choosePassword: { en: "Choose a password", vi: "Chọn mật khẩu" } satisfies Text,
  showPassword: { en: "Show password", vi: "Hiện mật khẩu" } satisfies Text,
  hidePassword: { en: "Hide password", vi: "Ẩn mật khẩu" } satisfies Text,
  savePasswordHint: {
    en: "When your phone offers to save the password, tap Save. Then you never need to type it again.",
    vi: "Khi điện thoại hỏi có lưu mật khẩu không, hãy bấm Lưu. Như vậy bạn sẽ không phải gõ lại nữa.",
  } satisfies Text,
  signInButton: { en: "Sign in", vi: "Đăng nhập" } satisfies Text,
  nextButton: { en: "Next", vi: "Tiếp tục" } satisfies Text,
  createNewAccount: { en: "Create new account", vi: "Tạo tài khoản mới" } satisfies Text,
  createNewAccountQuestion: { en: "Create new account?", vi: "Tạo tài khoản mới?" } satisfies Text, // the banner's link
  haveAccount: { en: "I already have an account", vi: "Tôi đã có tài khoản" } satisfies Text,
  backToSignIn: { en: "Back to sign in", vi: "Quay lại đăng nhập" } satisfies Text,
  working: { en: "Please wait…", vi: "Xin chờ…" } satisfies Text,
  forgotPassword: { en: "Forgot password?", vi: "Quên mật khẩu?" } satisfies Text,
  forgotHeading: { en: "Reset your password", vi: "Đặt lại mật khẩu" } satisfies Text,
  forgotExplain: {
    en: "Enter your email. We will send you a link to choose a new password.",
    vi: "Nhập email của bạn. Chúng tôi sẽ gửi đường dẫn để chọn mật khẩu mới.",
  } satisfies Text,
  sendLinkButton: { en: "Send me a link", vi: "Gửi đường dẫn cho tôi" } satisfies Text,

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
  tappedTheLink: { en: "I tapped the link: sign me in", vi: "Tôi đã bấm đường dẫn: đăng nhập" } satisfies Text,
  useAnotherEmail: { en: "Start again", vi: "Làm lại từ đầu" } satisfies Text,

  // A new password (components/NewPasswordForm.tsx)
  newPasswordHeading: { en: "Choose a new password", vi: "Chọn mật khẩu mới" } satisfies Text,
  savePasswordButton: { en: "Save password", vi: "Lưu mật khẩu" } satisfies Text,
  passwordSaved: { en: "Password saved", vi: "Đã lưu mật khẩu" } satisfies Text,
  changePassword: { en: "Change password", vi: "Đổi mật khẩu" } satisfies Text,

  accountHeading: { en: "Account", vi: "Tài khoản" } satisfies Text,
  signedInAs: { en: "Signed in", vi: "Đã đăng nhập" } satisfies Text,
  signOutButton: { en: "Sign out", vi: "Đăng xuất" } satisfies Text,

  // The page a new account's link opens in the browser (components/EmailConfirmed.tsx)
  emailConfirmed: { en: "Email confirmed", vi: "Đã xác nhận email" } satisfies Text,
  backToTheApp: {
    en: "Now go back to the page where you created your account. It will go on by itself.",
    vi: "Bây giờ hãy quay lại trang bạn đã tạo tài khoản. Trang đó sẽ tự tiếp tục.",
  } satisfies Text,

  // The screen a password-reset link opens (components/ConfirmLink.tsx)
  confirmPrompt: { en: "Reset your password?", vi: "Đặt lại mật khẩu?" } satisfies Text,
  onlyIfYouAsked: {
    en: `Tap the button only if you just asked to reset your password in the ${APP_NAME} app.`,
    vi: `Chỉ bấm nút nếu bạn vừa yêu cầu đặt lại mật khẩu trong ứng dụng ${APP_NAME}.`,
  } satisfies Text,
  confirmButton: { en: "Yes, reset my password", vi: "Đồng ý, đặt lại mật khẩu" } satisfies Text,
  confirmed: { en: "Done", vi: "Xong" } satisfies Text,
  goBackToTheApp: {
    en: `Now go back to the ${APP_NAME} app. It will ask you for a new password.`,
    vi: `Bây giờ hãy quay lại ứng dụng ${APP_NAME}. Ứng dụng sẽ hỏi mật khẩu mới.`,
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
  // These two end with a link in the banner: "Forgot password?" and "Create new account?".
  wrongPassword: { en: "Wrong password.", vi: "Sai mật khẩu." },
  noAccount: { en: "Account not created yet.", vi: "Tài khoản chưa được tạo." },
  weakPassword: {
    en: "That password is too short. Use at least 6 letters or numbers.",
    vi: "Mật khẩu quá ngắn. Xin dùng ít nhất 6 chữ hoặc số.",
  },
  samePassword: {
    en: "That is already your password. Choose a different one.",
    vi: "Đây đã là mật khẩu của bạn. Xin chọn mật khẩu khác.",
  },
  notConfirmed: {
    en: "Your account is not confirmed yet. Tap the link in the email we sent you.",
    vi: "Tài khoản chưa được xác nhận. Xin bấm vào đường dẫn trong email chúng tôi đã gửi.",
  },
  alreadyRegistered: {
    en: "This email already has an account. Tap “I already have an account” to sign in.",
    vi: "Email này đã có tài khoản. Bấm “Tôi đã có tài khoản” để đăng nhập.",
  },
  other: { en: "Something went wrong. Please try again.", vi: "Có lỗi xảy ra. Xin thử lại." },
};
