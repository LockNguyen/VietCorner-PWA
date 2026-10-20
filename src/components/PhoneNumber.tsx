"use client";

import { Copy, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import ActionMenu from "@/components/ui/ActionMenu";
import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { dialable } from "@/lib/phone";

// A phone number to tap (an event's card and page, a group's page, the staff page): a menu under it offers
// call it, text it (the phone's own apps, through `tel:` and `sms:` links), or copy it, for a phone where
// neither app opens. Shared, not a feature's: several features show contact numbers.
export default function PhoneNumber({ phone, onDark = false }: { phone: string; onDark?: boolean }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [anchor, setAnchor] = useState<DOMRect | null>(null); // where the number is while the menu is open
  const number = dialable(phone);
  const close = () => setAnchor(null);

  async function copy() {
    close();
    try {
      await navigator.clipboard.writeText(phone);
      showBanner({ kind: "success", message: t(COMMON.numberCopied) });
    } catch {
      // Clipboard refused (an old browser): the number is on screen to read and type.
    }
  }

  return (
    // `self-start`: in a column (a contact card) the number keeps its own width instead of stretching and
    // centring; `inline-flex`: in a line of words ("Liên hệ: …") it stays in the line.
    <span className="inline-flex self-start">
      <Button
        variant={onDark ? "inlineOnDark" : "inline"} // onDark: a lighter blue, over a dark photo
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(event.currentTarget.getBoundingClientRect())}
      >
        {phone}
      </Button>
      {anchor && (
        <ActionMenu
          anchor={anchor}
          // On a white pill, so it reads the same over a photo card as on a white page.
          raised={<span className="-ms-2 rounded-thumb bg-surface px-2 py-1 text-body font-medium text-action">{phone}</span>}
          onClose={close}
          items={[
            { icon: <Phone className="text-success" />, label: t(COMMON.call), onSelect: () => (window.location.href = `tel:${number}`) },
            { icon: <MessageCircle className="text-action" />, label: t(COMMON.sendText), onSelect: () => (window.location.href = `sms:${number}`) },
            { icon: <Copy className="text-caution" />, label: t(COMMON.copy), onSelect: copy },
          ]}
        />
      )}
    </span>
  );
}
