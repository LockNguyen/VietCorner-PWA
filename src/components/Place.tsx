"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import ActionMenu from "@/components/ui/ActionMenu";
import Button from "@/components/ui/Button";
import { AppleLogo, GoogleLogo } from "@/components/ui/MapLogos";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { mapLinks } from "@/lib/mapLinks";
import { useBanner } from "@/lib/useBanner";

type Props = {
  name: string; // what is tapped: the place's name ("Gotham building"), or the address itself
  address: string;
  onDark?: boolean; // over a dark photo (an event card): a lighter blue
};

// A place to tap: the same kind of menu as a phone number (`PhoneNumber`), with the full address on top, then
// Google Maps, Apple Maps, or copy (the user, 2026-10-20). Where each map leads is `mapLinks`' business.
export default function Place({ name, address, onDark = false }: Props) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [anchor, setAnchor] = useState<DOMRect | null>(null); // where the name is while the menu is open
  const links = mapLinks(address);
  const close = () => setAnchor(null);

  // A new tab: in the installed app this hands the place to the maps app (or Safari) instead of leaving ours.
  function openMap(url: string) {
    close();
    window.open(url, "_blank", "noopener");
  }

  async function copy() {
    close();
    try {
      await navigator.clipboard.writeText(address);
      showBanner({ kind: "success", message: t(COMMON.addressCopied) });
    } catch {
      // Clipboard refused (an old browser): the address is on screen to read.
    }
  }

  return (
    <span className="inline-flex self-start">
      <Button
        variant={onDark ? "inlineOnDark" : "inline"}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(event.currentTarget.getBoundingClientRect())}
      >
        {name}
      </Button>
      {anchor && (
        <ActionMenu
          anchor={anchor}
          raised={<span className="-ms-2 rounded-thumb bg-surface px-2 py-1 text-body font-medium text-action">{name}</span>}
          heading={name === address ? undefined : address} // already lit above the menu when the name is the address
          onClose={close}
          items={[
            { icon: <GoogleLogo />, label: t(COMMON.googleMaps), onSelect: () => openMap(links.google) },
            { icon: <AppleLogo />, label: t(COMMON.appleMaps), onSelect: () => openMap(links.apple) },
            { icon: <Copy className="text-caution" />, label: t(COMMON.copy), onSelect: copy },
          ]}
        />
      )}
    </span>
  );
}
