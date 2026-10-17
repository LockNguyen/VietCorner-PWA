"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { dialable } from "@/lib/phone";

// A phone number to tap (a group's sheet, an event's page): it shows three choices, call it, text it (the
// phone's own apps, through `tel:` and `sms:` links), or copy it, for a phone where neither app opens.
// Shared, not a feature's: two features show contact numbers, and each brings its own label or icon.
export default function PhoneNumber({ phone }: { phone: string }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [choosing, setChoosing] = useState(false);
  const number = dialable(phone);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      showBanner({ kind: "success", message: t(COMMON.copied) });
    } catch {
      // Clipboard refused (an old browser): the number is on screen to read and type.
    }
    setChoosing(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="inline" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>
        {phone}
      </Button>
      {choosing && (
        <div className="grid w-full grid-cols-3 gap-2">
          <Button variant="quiet" onClick={() => (window.location.href = `tel:${number}`)}>
            {t(COMMON.call)}
          </Button>
          <Button variant="quiet" onClick={() => (window.location.href = `sms:${number}`)}>
            {t(COMMON.sendText)}
          </Button>
          <Button variant="quiet" onClick={copy}>
            {t(COMMON.copyNumber)}
          </Button>
        </div>
      )}
    </div>
  );
}
