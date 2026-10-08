import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  tone?: keyof typeof TONES;
  current?: boolean;
  href?: string;
  onClick?: () => void;
};

const ITEM = "ms-3 border-b border-line";
const ROW = "flex min-h-row w-full items-center gap-3 py-2 pe-3 text-start focus-visible:outline-2 focus-visible:outline-action";
const TONES = { normal: "text-ink", off: "text-subtle line-through" } as const;

// One line of any list: a picture, a title over a subtitle, and something at its right end.
// With `href` it is a link, with `onClick` a button. Both end in a chevron unless `trailing` is passed.
export default function ListRow({ title, subtitle, leading, trailing, tone = "normal", current, href, onClick }: Props) {
  const opens = Boolean(href || onClick);
  const content = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col wrap-anywhere">
        <span className={`text-body ${TONES[tone]}`}>{title}</span>
        {subtitle && <span className="text-small text-subtle">{subtitle}</span>}
      </span>
      {trailing !== undefined ? trailing : opens && <ChevronRight aria-hidden className="shrink-0 text-line" />}
    </>
  );

  return (
    <li className={ITEM}>
      {href ? (
        <Link href={href} aria-current={current} className={ROW}>{content}</Link>
      ) : onClick ? (
        <button onClick={onClick} aria-current={current} className={ROW}>{content}</button>
      ) : (
        <div className={ROW}>{content}</div>
      )}
    </li>
  );
}
