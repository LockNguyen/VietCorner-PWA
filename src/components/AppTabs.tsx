"use client";

import { CalendarDays, HandHeart, House, ShieldCheck, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import TabBar from "@/components/ui/TabBar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
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

// The tab bar as this app fills it: which tabs exist, and which one the current address belongs to.
export default function AppTabs({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useLanguage(); // I18N
  const tabs = showAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <TabBar
      tabs={tabs.map(({ href, label, Icon }) => ({
        href,
        label: t(label),
        icon: <Icon />,
        // Home is "/" exactly: every address starts with "/", so it cannot be matched by its beginning.
        active: href === "/" ? pathname === "/" : pathname.startsWith(href),
      }))}
    />
  );
}
