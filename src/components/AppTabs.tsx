"use client";

import { CalendarDays, HandHeart, House, ShieldCheck, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import TabBar from "@/components/ui/TabBar";
import { directionOf, restoresScroll } from "@/lib/navigation";
import { slideOf } from "@/lib/slide";
import { useLoadAhead } from "@/lib/useLoadAhead";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { useNavigation } from "./Navigation";
import { SHELL_STRINGS } from "./strings";

// Add or remove a tab here when adding or removing a feature (and in MAIN_SCREENS, src/lib/navigation.ts, which
// decides how the screen moves). Five is the most the bar holds.
const TABS = [
  { href: "/", label: SHELL_STRINGS.homeTab, Icon: House },
  { href: "/events", label: SHELL_STRINGS.eventsTab, Icon: CalendarDays },
  { href: "/prayer", label: SHELL_STRINGS.prayerTabShort, Icon: HandHeart },
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
  const { aside, restoreOnArrival } = useNavigation();
  const tabs = showAdmin ? [...TABS, ADMIN_TAB] : TABS;
  // Every tab's screen is loaded in the background and kept fresh, so a tap shows it at once (the user, 2026-10-22).
  // Only these: Staff, Settings and the assistant are rarely opened and load when tapped.
  useLoadAhead(tabs.map((tab) => tab.href));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const short = (label: Text) => (label === SHELL_STRINGS.eventsTab && (bigText || showAdmin) ? SHELL_STRINGS.eventsTabShort : label);

  return (
    <TabBar
      tabs={tabs.map(({ href, label, Icon }) => ({
        href,
        label: t(short(label)),
        icon: <Icon />,
        // Home is "/" exactly: every address starts with "/", so it cannot be matched by its beginning.
        active: isActive(href),
        // How the screen moves, and whether it lands where it was left: src/lib/navigation.ts decides both.
        transitionTypes: slideOf(directionOf(pathname, href, "tab")),
        keepsScroll: restoresScroll("tab", pathname, href, aside),
        onSelect: () => {
          if (restoresScroll("tab", pathname, href, aside)) restoreOnArrival(href);
        },
      }))}
    />
  );
}
