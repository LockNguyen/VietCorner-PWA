"use client";

import { CalendarDays, HandHeart, Users } from "lucide-react";
import PhotoTile from "@/components/ui/PhotoTile";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SHELL_STRINGS } from "./strings";

const TILES = [
  { href: "/events", title: SHELL_STRINGS.eventsTab, Icon: CalendarDays },
  { href: "/prayer", title: SHELL_STRINGS.prayerTab, Icon: HandHeart },
  { href: "/groups", title: SHELL_STRINGS.groupsTab, Icon: Users },
];

// Home's content for now: one large tile into each area. It becomes a dashboard later.
export default function HomeTiles() {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col gap-6 p-5">
      {TILES.map(({ href, title, Icon }) => (
        <PhotoTile key={href} href={href} title={t(title)}>
          <Icon className="size-8" />
        </PhotoTile>
      ))}
    </div>
  );
}
