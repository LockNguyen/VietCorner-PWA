"use client";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useConfirmLink } from "../hooks/useConfirmLink";
import { STRINGS } from "../strings";

type Props = { attempt: string | undefined; tokenHash: string | undefined }; // from the link's address

// The screen a sign-in email's link opens. In the browser that asked it signs in and moves on; anywhere else it
// asks for one tap, then sends the person back to the app (hooks/useConfirmLink.ts).
export default function ConfirmLink({ attempt, tokenHash }: Props) {
  const { t } = useLanguage(); // I18N
  const { state, confirm } = useConfirmLink(attempt, tokenHash);
  const { pending, run } = usePending<"confirm">();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {state === "checking" && <Spinner />}
      {state === "ask" && (
        <div className="flex w-full flex-col gap-3">
          <Text as="h2" variant="tile">{t(STRINGS.confirmPrompt)}</Text>
          <Text tone="subtle">{t(STRINGS.onlyIfYouAsked)}</Text>
          <Button pending={pending === "confirm"} onClick={() => run("confirm", confirm)}>
            {t(STRINGS.confirmButton)}
          </Button>
        </div>
      )}
      {state === "left" && (
        <div className="flex flex-col gap-3">
          <Text as="h2" variant="tile">{t(STRINGS.confirmed)}</Text>
          <Text tone="subtle">{t(STRINGS.goBackToTheApp)}</Text>
        </div>
      )}
      {state === "failed" && (
        <div className="flex flex-col gap-3">
          <Text as="h2" variant="tile">{t(STRINGS.linkDidNotWork)}</Text>
          <Text tone="subtle">{t(STRINGS.askForANewLink)}</Text>
        </div>
      )}
    </div>
  );
}
