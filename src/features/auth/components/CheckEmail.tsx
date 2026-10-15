"use client";

import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

type Props = {
  sentTo: string;
  onStartOver: () => void;
  onSignIn?: () => void; // set when the app cannot check by itself (its password was lost in a reload)
};

// While an email's link is awaited. The screen moves on by itself once the link is used (hooks/useEmailLink.ts).
export default function CheckEmail({ sentTo, onStartOver, onSignIn }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex w-full flex-col gap-3 text-center wrap-anywhere">
      <Text as="h1" variant="tile">{t(STRINGS.linkSentTo)} {sentTo}</Text>
      <Text>{t(STRINGS.openTheLink)}</Text>
      <Text tone="subtle">{t(STRINGS.checkSpam)}</Text>
      {onSignIn && <Button onClick={onSignIn}>{t(STRINGS.tappedTheLink)}</Button>}
      <Button variant="text" onClick={onStartOver}>
        {t(STRINGS.useAnotherEmail)}
      </Button>
    </div>
  );
}
