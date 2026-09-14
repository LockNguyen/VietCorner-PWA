"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add or remove a tab here when adding or removing a feature.
const TABS = [
  { href: "/groups", label: "Groups", icon: "💬" },
  { href: "/assistant", label: "Assistant", icon: "🎙️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function TabBar() {
  const pathname = usePathname();

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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
