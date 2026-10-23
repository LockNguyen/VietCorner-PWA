import Link from "next/link";
import type { ReactNode } from "react";

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  transitionTypes?: string[]; // how the screen moves when this tab opens (src/lib/slide.ts)
  keepsScroll?: boolean; // the screen opens where it was left, not at its top
  onSelect?: () => void; // told just before the tab opens
};
type Props = { tabs: Tab[] };

const TAB = "flex flex-1 flex-col items-center justify-center gap-1 text-tab focus-visible:outline-2 focus-visible:outline-action";
const STATES = { active: "text-action", inactive: "text-subtle" } as const;

// The bar at the bottom of every screen: one icon and one word per destination.
export default function TabBar({ tabs }: Props) {
  return (
    <nav className="slide-anchor-tab-bar fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-safe">
      <div className="mx-auto flex h-tabs max-w-column">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            // Whoever fills the bar loads the screens ahead and keeps them fresh (AppTabs: `useLoadAhead`).
            prefetch={false}
            transitionTypes={tab.transitionTypes}
            scroll={!tab.keepsScroll}
            onClick={tab.onSelect}
            aria-current={tab.active ? "page" : undefined}
            className={`${TAB} ${STATES[tab.active ? "active" : "inactive"]}`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
