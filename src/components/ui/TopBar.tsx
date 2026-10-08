import type { ReactNode } from "react";

type Props = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
};

// The bar at the top of every screen: a centred title, with room for icons at either end.
export default function TopBar({ title, left, right }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-action pt-safe text-on-action">
      <div className="relative mx-auto flex h-bar max-w-column items-center justify-between">
        <div className="flex">{left}</div>
        {/* Centred on the bar, not on the space the icons leave, so it never shifts between screens. */}
        <h1 className="absolute inset-x-24 truncate text-center text-body font-semibold">{title}</h1>
        <div className="flex">{right}</div>
      </div>
    </header>
  );
}
