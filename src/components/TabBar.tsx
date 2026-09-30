"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { SHELL_STRINGS } from "./strings";

// Add or remove a tab here when adding or removing a feature.
const TABS = [
  { href: "/groups", label: SHELL_STRINGS.groupsTab, icon: "💬" },
  { href: "/assistant", label: SHELL_STRINGS.assistantTab, icon: "🎙️" },
  { href: "/settings", label: SHELL_STRINGS.settingsTab, icon: "⚙️" },
];

export default function TabBar() {
  const pathname = usePathname();
  const { t } = useLanguage(); // I18N

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t bg-gray-50 pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
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
