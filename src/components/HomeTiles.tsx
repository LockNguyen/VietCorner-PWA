"use client";

import { CalendarDays, HandHeart, ShieldCheck, Users } from "lucide-react";
import PhotoTile from "@/components/ui/PhotoTile";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SHELL_STRINGS } from "./strings";

// The photos are files in public/images/home, chosen by the user (2026-10-14).
const TILES = [
  { href: "/events", title: SHELL_STRINGS.eventsTab, Icon: CalendarDays, photo: "/images/home/events.png" },
  { href: "/prayer", title: SHELL_STRINGS.prayerTab, Icon: HandHeart, photo: "/images/home/prayer.png" },
  { href: "/groups", title: SHELL_STRINGS.groupsTab, Icon: Users, photo: "/images/home/groups.png" },
];

// The fourth tile, for whoever manages something: the Admin tab. No photo: its icon on grey.
const ADMIN_TILE = { href: "/admin", title: SHELL_STRINGS.adminTab, Icon: ShieldCheck, photo: undefined };

// Home's content for now: one large tile into each area, and Admin for admins. It becomes a dashboard later.
export default function HomeTiles({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useLanguage(); // I18N
  const tiles = showAdmin ? [...TILES, ADMIN_TILE] : TILES;

  return (
    <div className="flex flex-col gap-6 p-5">
      {tiles.map(({ href, title, Icon, photo }) => (
        <PhotoTile key={href} href={href} title={t(title)} src={photo}>
          <Icon className="size-8" />
        </PhotoTile>
      ))}
    </div>
  );
}
