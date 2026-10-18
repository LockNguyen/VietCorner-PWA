"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

type Props = { sentTo: string; onStartOver: () => void };

// While an email's link is awaited: a heading, the address, one short line, and where else to look. Few
// words on purpose (the user, 2026-10-17). The screen moves on by itself once the link is used (hooks/useEmailLink.ts).
export default function CheckEmail({ sentTo, onStartOver }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex w-full flex-col gap-3 text-center wrap-anywhere">
      <Text as="h1" variant="tile">{t(STRINGS.emailSent)}</Text>
      <Text tone="subtle">{sentTo}</Text>
      <Text>{t(STRINGS.openTheLink)}</Text>
      <Text tone="subtle">{t(STRINGS.checkSpam)}</Text>
      <Button variant="text" onClick={onStartOver}>
        {t(STRINGS.useAnotherEmail)}
      </Button>
    </div>
  );
}
