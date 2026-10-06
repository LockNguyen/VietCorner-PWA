"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SHELL_STRINGS } from "./strings";

// Add or remove a tab here when adding or removing a feature.
const TABS = [
  { href: "/groups", label: SHELL_STRINGS.groupsTab, icon: "💬" },
  { href: "/events", label: SHELL_STRINGS.eventsTab, icon: "📅" },
  { href: "/prayer", label: SHELL_STRINGS.prayerTab, icon: "🙏" },
  { href: "/assistant", label: SHELL_STRINGS.assistantTab, icon: "🎙️" },
  { href: "/settings", label: SHELL_STRINGS.settingsTab, icon: "⚙️" },
];

// PERMISSIONS: shown only to someone who may manage something. Hiding it is a convenience; the page and
// the database each check again.
const ADMIN_TAB = { href: "/admin", label: SHELL_STRINGS.adminTab, icon: "🛠️" };

export default function TabBar({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useLanguage(); // I18N
  const tabs = showAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t bg-gray-50 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs ${active ? "text-blue-500" : "text-gray-500"}`}
          >
            <span className="text-xl">{tab.icon}</span>
            {t(tab.label)}
          </Link>
        );
      })}
    </nav>
  );
}
