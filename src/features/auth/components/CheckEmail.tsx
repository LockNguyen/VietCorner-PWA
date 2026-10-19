"use client";

import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// While an email's link is awaited: "Check your email" and the address, in bold, and one short line. Few
// words on purpose (the user, 2026-10-17); the way back is the frame's arrow. The screen moves on by itself
// once the link is used (hooks/useEmailLink.ts).
export default function CheckEmail({ sentTo }: { sentTo: string }) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex w-full flex-col gap-3 text-center wrap-anywhere">
      <Text as="h1" variant="tile">
        {t(STRINGS.emailSent)}
        <br />
        {sentTo}
      </Text>
      <Text>{t(STRINGS.openTheLink)}</Text>
    </div>
  );
}
