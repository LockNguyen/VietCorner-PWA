import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import LoginForm from "@/features/auth/components/LoginForm";
import LanguageToggle from "@/features/i18n/components/LanguageToggle"; // I18N

export default function LoginPage() {
  return (
    <>
      <PageHeader title={SHELL_STRINGS.signInTitle} />
      {/* I18N: chosen before the account exists; the first sign-in saves it to the account. */}
      <LanguageToggle />
      <LoginForm />
    </>
  );
}
