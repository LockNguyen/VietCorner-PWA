"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { dialable } from "../phone";
import { STRINGS } from "../strings";

// A group's contact number on its sheet. Tapping it shows three choices: call it, text it (the phone's own
// apps, through `tel:` and `sms:` links), or copy it, for a phone where neither app opens.
export default function ContactLine({ phone }: { phone: string }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [choosing, setChoosing] = useState(false);
  const number = dialable(phone);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      showBanner({ kind: "success", message: t(STRINGS.copied) });
    } catch {
      // Clipboard refused (an old browser): the number is on screen to read and type.
    }
    setChoosing(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start">
        <Text variant="small" tone="subtle">{t(STRINGS.contact)}</Text>
        <Button variant="text" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>
          {phone}
        </Button>
      </div>
      {choosing && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="quiet" onClick={() => (window.location.href = `tel:${number}`)}>
            {t(STRINGS.call)}
          </Button>
          <Button variant="quiet" onClick={() => (window.location.href = `sms:${number}`)}>
            {t(STRINGS.sendText)}
          </Button>
          <Button variant="quiet" onClick={copy}>
            {t(STRINGS.copyNumber)}
          </Button>
        </div>
      )}
    </div>
  );
}
