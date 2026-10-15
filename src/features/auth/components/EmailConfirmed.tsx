"use client";

import { CircleCheck } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useConfirmedLink } from "../hooks/useConfirmedLink";
import { STRINGS } from "../strings";

// What a new account's email link opens. In the browser that signed up it signs in and goes on by itself;
// anywhere else it says the email is confirmed and to go back to where the account was made.
export default function EmailConfirmed() {
  const { t } = useLanguage(); // I18N
  const state = useConfirmedLink();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {state === "checking" && <Spinner />}
      {state === "confirmed" && (
        <div className="flex flex-col items-center gap-3">
          <CircleCheck aria-hidden size={48} />
          <Text as="h1" variant="tile">{t(STRINGS.emailConfirmed)}</Text>
          <Text>{t(STRINGS.backToTheApp)}</Text>
        </div>
      )}
      {state === "failed" && (
        <div className="flex flex-col gap-3">
          <Text as="h1" variant="tile">{t(STRINGS.linkDidNotWork)}</Text>
          <Text tone="subtle">{t(STRINGS.askForANewLink)}</Text>
        </div>
      )}
    </div>
  );
}
