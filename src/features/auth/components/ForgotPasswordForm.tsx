"use client";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";

type Props = { email: string; onEmailChange: (email: string) => void; onSend: (email: string) => Promise<void> };

// "Forgot password?": the email address to send a reset link to.
export default function ForgotPasswordForm({ email, onEmailChange, onSend }: Props) {
  const { t } = useLanguage(); // I18N
  // One request at a time: a second tap would email a second link.
  const { pending, run } = usePending<"send">();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run("send", () => onSend(email.trim()));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <Text as="h1" variant="tile">{t(STRINGS.forgotHeading)}</Text>
      <Text tone="subtle">{t(STRINGS.forgotExplain)}</Text>
      <Field label={t(STRINGS.emailLabel)}>
        <TextInput
          type="email"
          name="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </Field>
      <Button pending={pending === "send"} pendingLabel={t(STRINGS.working)}>
        {t(STRINGS.sendLinkButton)}
      </Button>
    </form>
  );
}
