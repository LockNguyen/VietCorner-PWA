"use client";

import { useState } from "react";
import Banner from "@/components/ui/Banner";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanners } from "@/lib/useBanner";
import { SHELL_STRINGS } from "./strings";

// Draws the banners at the bottom of the screen, above the tabs. One shows as itself; several show as a
// stack (the newest, with a count), which a tap opens into the full list. A tap on a single one removes it.
export default function BannerHost() {
  const { banners, dismiss } = useBanners();
  const { t } = useLanguage(); // I18N
  const [opened, setOpened] = useState(false);

  // A stack that has shrunk to one is no longer a stack: the next one that forms starts closed again.
  if (opened && banners.length <= 1) setOpened(false);
  if (banners.length === 0) return null;

  const newest = banners[banners.length - 1];
  const isStack = banners.length > 1 && !opened;

  return (
    <div role="status" className="fixed inset-x-0 bottom-above-tabs z-30 mx-auto flex max-w-column flex-col gap-2 px-3">
      {isStack ? (
        <Banner kind={newest.kind} message={newest.message} more={banners.length - 1} onClick={() => setOpened(true)} />
      ) : (
        banners.map((banner) => (
          <Banner
            key={banner.id}
            kind={banner.kind}
            message={banner.message}
            actionLabel={banner.action?.label}
            onAction={() => {
              dismiss(banner.id);
              banner.action?.onAct();
            }}
            aria-label={banner.action ? t(SHELL_STRINGS.close) : undefined} // the cross alone, when it is its own button
            onClick={() => dismiss(banner.id)}
          />
        ))
      )}
    </div>
  );
}
