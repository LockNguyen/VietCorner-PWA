"use client";

import type { FormEvent } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";

type Props = {
  email: string; // kept by the parent, so "Create new account?" starts filled in
  onEmailChange: (email: string) => void;
  onSignIn: (email: string) => Promise<void>; // sends the link; the parent says in a banner if it failed
  onCreateAccount: () => void;
};

// The first screen when signed out: one field, one blue button, and "Create new account?" small under it.
// No password: the email's link signs in (the README, "Flow"), so there is nothing to forget or reset.
export default function SignInForm({ email, onEmailChange, onSignIn, onCreateAccount }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"send">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run("send", () => onSignIn(email.trim()));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 pt-4">
      <TextInput
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder={t(STRINGS.emailLabel)}
        aria-label={t(STRINGS.emailLabel)}
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <Button pending={pending === "send"} pendingLabel={t(STRINGS.working)}>
        {t(STRINGS.signInButton)}
      </Button>
      <Button type="button" variant="text" onClick={onCreateAccount}>
        {t(STRINGS.createNewAccountQuestion)}
      </Button>
    </form>
  );
}
