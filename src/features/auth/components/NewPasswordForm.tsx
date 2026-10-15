"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { SignInProblem } from "../errors";
import { useProblemBanner } from "../hooks/useProblemBanner";
import { STRINGS } from "../strings";
import PasswordField from "./PasswordField";

type Props = { email: string; problem: SignInProblem | null }; // `problem`: sent back by the route

// A new password, after "Forgot password?" or from Settings. Posted the classic way to
// `/api/auth/new-password`, so the phone offers to save it (the README, "Saving the password"). The email
// is shown, read-only, because a password manager saves the pair and needs to know whose password it is.
export default function NewPasswordForm({ email, problem }: Props) {
  const { t } = useLanguage(); // I18N
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  useProblemBanner(problem, () => undefined); // why the last try failed, in the app's banner

  return (
    <form
      method="post"
      action="/api/auth/new-password"
      onSubmit={() => setSending(true)}
      className="flex flex-col gap-4 px-5 pt-6"
    >
      <Text as="h1" variant="tile">{t(STRINGS.newPasswordHeading)}</Text>
      <Field label={t(STRINGS.emailLabel)}>
        <TextInput type="email" name="email" autoComplete="username" value={email} readOnly />
      </Field>
      <PasswordField label={t(STRINGS.newPasswordLabel)} autoComplete="new-password" value={password} onChange={setPassword} />
      <Button pending={sending} pendingLabel={t(STRINGS.working)}>
        {t(STRINGS.savePasswordButton)}
      </Button>
    </form>
  );
}
