"use client";

import { CalendarDays, HandHeart, House, ShieldCheck, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import TabBar from "@/components/ui/TabBar";
import { GO_BACK, GO_FORWARD } from "@/lib/slide";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { SHELL_STRINGS } from "./strings";

// Add or remove a tab here when adding or removing a feature. Five is the most the bar holds.
const TABS = [
  { href: "/", label: SHELL_STRINGS.homeTab, Icon: House },
  { href: "/events", label: SHELL_STRINGS.eventsTab, Icon: CalendarDays },
  { href: "/prayer", label: SHELL_STRINGS.prayerTab, Icon: HandHeart },
  { href: "/groups", label: SHELL_STRINGS.groupsTab, Icon: Users },
];

// PERMISSIONS: only for someone who may manage something. Hiding it is courtesy; the page checks again.
const ADMIN_TAB = { href: "/admin", label: SHELL_STRINGS.adminTab, Icon: ShieldCheck };

type Props = {
  showAdmin: boolean;
  bigText: boolean; // TEXT-SIZE: the phone's "Chữ to"
};

// The tab bar as this app fills it: which tabs exist, and which one the current address belongs to.
// With big text, or five tabs, "Lịch sinh hoạt" is too long for its place: it reads "Lịch" (the user, 2026-10-17).
export default function AppTabs({ showAdmin, bigText }: Props) {
  const pathname = usePathname();
  const { t } = useLanguage(); // I18N
  const tabs = showAdmin ? [...TABS, ADMIN_TAB] : TABS;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // Home is the anchor (the user, 2026-10-17): from Home a tab slides in; to Home, or from an inner screen
  // (an event's page) to its own tab, the screen slides away; between two tabs nothing moves.
  function direction(href: string) {
    if (pathname === href) return undefined;
    if (href === "/") return GO_BACK;
    if (pathname === "/") return GO_FORWARD;
    if (pathname.startsWith(`${href}/`)) return GO_BACK;
    return undefined;
  }
  const short = (label: Text) => (label === SHELL_STRINGS.eventsTab && (bigText || showAdmin) ? SHELL_STRINGS.eventsTabShort : label);

  return (
    <TabBar
      tabs={tabs.map(({ href, label, Icon }) => ({
        href,
        label: t(short(label)),
        icon: <Icon />,
        // Home is "/" exactly: every address starts with "/", so it cannot be matched by its beginning.
        active: isActive(href),
        transitionTypes: direction(href),
      }))}
    />
  );
}
