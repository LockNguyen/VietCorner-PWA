import Link from "next/link";
import type { ReactNode } from "react";

// transitionTypes: how the screen moves when this tab opens (src/lib/slide.ts)
type Tab = { href: string; label: string; icon: ReactNode; active: boolean; transitionTypes?: string[] };
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
            // Each tab is one tap away, so its whole page (data included) is loaded as soon as the bar shows,
            // not only its grey placeholder. Kept for `staleTimes.static` (next.config.ts).
            prefetch={true}
            transitionTypes={tab.transitionTypes}
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
