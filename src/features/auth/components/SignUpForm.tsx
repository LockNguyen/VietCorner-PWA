"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { MAX_NAME_LENGTH } from "@/features/profiles/types"; // PROFILES
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";

type Props = {
  email: string; // carried over from the sign-in screen
  onEmailChange: (email: string) => void;
  onCreate: (name: string, email: string) => Promise<void>; // sends the link; the parent says if it failed
  onHaveAccount: () => void;
  extra?: ReactNode; // under the email, before Next: the text size choice (from the page)
};

// A new account, in the same calm shape as sign-in: a short title, the name and the email with their words
// inside, one blue Next (off until both are filled), and "I already have an account" small under it.
// No password: the email's link signs the new member in.
export default function SignUpForm({ email, onEmailChange, onCreate, onHaveAccount, extra }: Props) {
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState("");
  const { pending, run } = usePending<"create">();
  const complete = name.trim() !== "" && email.trim() !== "";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run("create", () => onCreate(name.trim(), email.trim()));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 pt-4">
      <div className="pb-1 text-center">
        <Text as="h1" variant="tile">{t(STRINGS.signUpHeading)}</Text>
      </div>
      <TextInput
        name="name"
        required
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        placeholder={t(STRINGS.nameLabel)}
        aria-label={t(STRINGS.nameLabel)}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
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
      {extra}
      <Button disabled={!complete} pending={pending === "create"} pendingLabel={t(STRINGS.working)}>
        {t(STRINGS.nextButton)}
      </Button>
      <Button type="button" variant="text" onClick={onHaveAccount}>
        {t(STRINGS.haveAccount)}
      </Button>
    </form>
  );
}
