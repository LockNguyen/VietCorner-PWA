import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import LoginForm from "@/features/auth/components/LoginForm";
import LanguageLink from "@/features/i18n/components/LanguageLink"; // I18N

export default function LoginPage() {
  return (
    <>
      <PageHeader title={SHELL_STRINGS.signInTitle} plain />
      <LoginForm />
      {/* I18N: chosen before the account exists; the first sign-in saves it to the account. */}
      <div className="flex justify-center pt-6">
        <LanguageLink />
      </div>
    </>
  );
}
