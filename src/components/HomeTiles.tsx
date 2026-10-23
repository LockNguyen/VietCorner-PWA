"use client";

import { CalendarDays, Contact, HandHeart, ShieldCheck, Users } from "lucide-react";
import PhotoTile from "@/components/ui/PhotoTile";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS as STAFF_STRINGS } from "@/features/staff/strings"; // STAFF
import { directionOf } from "@/lib/navigation";
import { slideOf } from "@/lib/slide";
import { SHELL_STRINGS } from "./strings";

// The photos are files in public/images/home, chosen by the user (2026-10-14; Staff and Admin 2026-10-19).
const TILES = [
  { href: "/events", title: SHELL_STRINGS.eventsTab, Icon: CalendarDays, photo: "/images/home/events.png" },
  { href: "/prayer", title: SHELL_STRINGS.prayerTab, Icon: HandHeart, photo: "/images/home/prayer.png" },
  { href: "/groups", title: SHELL_STRINGS.groupsTab, Icon: Users, photo: "/images/home/groups.png" },
  { href: "/staff", title: STAFF_STRINGS.title, Icon: Contact, photo: "/images/home/staff.webp" }, // STAFF: not a tab, so only here
];

// The last tile, for whoever manages something: the Admin tab.
const ADMIN_TILE = { href: "/admin", title: SHELL_STRINGS.adminTab, Icon: ShieldCheck, photo: "/images/home/admin.webp" };

// Home's content for now: one large tile into each area (Staff last), and Admin for admins. It becomes a dashboard later.
export default function HomeTiles({ showAdmin }: { showAdmin: boolean }) {
  const { t } = useLanguage(); // I18N
  const tiles = showAdmin ? [...TILES, ADMIN_TILE] : TILES;
  // A main screen switches from Home; Admin, a detour, comes in from the right (src/lib/navigation.ts).
  const move = (href: string) => slideOf(directionOf("/", href, "open"));

  return (
    <div className="flex flex-col gap-6 p-5">
      {tiles.map(({ href, title, Icon, photo }) => (
        <PhotoTile key={href} href={href} transitionTypes={move(href)} title={t(title)} src={photo}>
          <Icon className="size-8" />
        </PhotoTile>
      ))}
    </div>
  );
}
