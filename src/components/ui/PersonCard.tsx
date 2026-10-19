import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  picture: ReactNode; // a large Avatar
  name: string;
  subtitle?: string; // under the name, quieter: their role
};

const BOX = "flex items-center gap-4 rounded-control border border-line bg-surface p-4";

// One person on a card, like a contact card: their picture at the left, their name in bold, their role in grey
// under it, then the children (a phone number to tap). Not itself a button: what is in it may be.
export default function PersonCard({ picture, name, subtitle, children, ...box }: Props) {
  return (
    <div {...box} className={BOX}>
      {picture}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-tile font-bold text-ink">{name}</span>
        {subtitle && <span className="text-body text-subtle">{subtitle}</span>}
        {children}
      </div>
    </div>
  );
}
