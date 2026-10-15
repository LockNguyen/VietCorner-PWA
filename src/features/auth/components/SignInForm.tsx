"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import PasswordField from "./PasswordField";

type Props = {
  email: string; // kept by the parent, so "Create new account" and "Forgot password?" start filled in
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
};

// The first screen when signed out, laid out like the big messaging apps: two fields with their words
// inside, one blue button, "Forgot password?" small under it, and a new account set apart below, so the
// eye lands on signing in and nothing else needs reading.
// The form is posted the classic way to `/api/auth/sign-in`, which answers with Home or this screen again:
// a real form post is what makes the phone offer "Save password?" (the README, "Saving the password").
// Why a try failed is said by the parent, in the app's banner (hooks/useProblemBanner.ts).
export default function SignInForm(props: Props) {
  const { email, password, onEmailChange, onPasswordChange, onCreateAccount, onForgotPassword } = props;
  const { t } = useLanguage(); // I18N
  // The page is about to be replaced; this only shows the tap was taken (and takes no second one).
  const [sending, setSending] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6 pt-4">
      <form method="post" action="/api/auth/sign-in" onSubmit={() => setSending(true)} className="flex flex-col gap-3">
        <TextInput
          type="email"
          name="email"
          required
          autoComplete="username"
          placeholder={t(STRINGS.emailLabel)}
          aria-label={t(STRINGS.emailLabel)}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        <PasswordField
          placeholder={t(STRINGS.passwordLabel)}
          autoComplete="current-password"
          value={password}
          onChange={onPasswordChange}
        />
        <Button pending={sending} pendingLabel={t(STRINGS.working)}>
          {t(STRINGS.signInButton)}
        </Button>
        <Button type="button" variant="text" onClick={onForgotPassword}>
          {t(STRINGS.forgotPassword)}
        </Button>
      </form>
      {/* Set apart by space: a different path, not one more question about signing in. */}
      <div className="flex flex-col pt-6">
        <Button type="button" variant="quiet" onClick={onCreateAccount}>
          {t(STRINGS.createNewAccount)}
        </Button>
      </div>
    </div>
  );
}
