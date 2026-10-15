"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { MAX_NAME_LENGTH } from "@/features/profiles/types"; // PROFILES
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import PasswordField from "./PasswordField";

type Props = {
  email: string; // carried over from the sign-in screen
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onCreate: (name: string, email: string, password: string) => Promise<void>;
  onHaveAccount: () => void;
};

// A new account, in the same calm shape as sign-in: a short title, three fields with their words inside
// (name on top, often the only empty one when coming from a failed sign-in), one blue Next, and "I already
// have an account" set apart below. Next stays off until all three are filled.
export default function SignUpForm(props: Props) {
  const { email, password, onEmailChange, onPasswordChange, onCreate, onHaveAccount } = props;
  const { t } = useLanguage(); // I18N
  const [name, setName] = useState("");
  const { pending, run } = usePending<"create">();
  const complete = name.trim() !== "" && email.trim() !== "" && password !== "";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run("create", () => onCreate(name.trim(), email.trim(), password));
  }

  return (
    <div className="flex w-full flex-col gap-6 pt-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          autoComplete="username"
          placeholder={t(STRINGS.emailLabel)}
          aria-label={t(STRINGS.emailLabel)}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
        <PasswordField
          placeholder={t(STRINGS.choosePassword)}
          autoComplete="new-password"
          value={password}
          onChange={onPasswordChange}
        />
        <Button disabled={!complete} pending={pending === "create"} pendingLabel={t(STRINGS.working)}>
          {t(STRINGS.nextButton)}
        </Button>
      </form>
      {/* Set apart by space, as on sign-in: a different path. */}
      <div className="flex flex-col pt-6">
        <Button type="button" variant="quiet" onClick={onHaveAccount}>
          {t(STRINGS.haveAccount)}
        </Button>
      </div>
    </div>
  );
}
