"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type MenuItem = { icon: ReactNode; label: string; onSelect: () => void };

type Props = {
  anchor: DOMRect; // where the thing that opened it is on the screen
  raised: ReactNode; // that thing drawn again over the dark, so it alone stays lit
  items: MenuItem[];
  onClose: () => void;
  heading?: string; // a first line that is read, not tapped, with no icon: an address over its map choices
};

// px, the menu's width: wider with a heading, so an address wraps less. It is also kept this far from the
// right edge of the screen.
const WIDTH = 192;
const WIDTH_WITH_HEADING = 288;
const VEIL = "fixed inset-0 z-40 bg-ink/60";
const RAISED = "fixed z-40 flex items-center";
const MENU = "fixed z-40 rounded-control bg-surface text-ink shadow";
const TAIL = "absolute -top-2 left-6 size-4 rotate-45 bg-surface";
const ROW = "flex min-h-touch w-full items-center gap-3 px-4 text-start text-body";
const HEADING = "px-4 py-3 text-body font-medium";

// A menu in a bubble just under what opened it, the way iOS 26 shows one: the screen goes dark except that
// thing and the menu, its choices are lines split by thin rules, and a tap anywhere else closes it.
// A portal to <body>: drawn inside a card or a sheet, `overflow-hidden` would cut it off.
// Scrolling closes it: it is pinned to where the thing was, and would drift away from it.
export default function ActionMenu({ anchor, raised, items, onClose, heading }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("scroll", onClose, { passive: true, capture: true }); // also the screen's own box
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onClose, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const width = heading ? WIDTH_WITH_HEADING : WIDTH;
  const left = Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16));

  return createPortal(
    <>
      <div aria-hidden className={VEIL} onClick={onClose} />
      <div aria-hidden className={RAISED} style={{ top: anchor.top, left: anchor.left, height: anchor.height }}>
        {raised}
      </div>
      {/* No gap added: `anchor.bottom` is already 12 px under the words (`Button` `inline` is 48 px tall). */}
      <div role="menu" className={MENU} style={{ top: anchor.bottom, left, width }}>
        <span aria-hidden className={TAIL} />
        <ul className="relative divide-y divide-line">
          {heading && <li role="presentation" className={HEADING}>{heading}</li>}
          {items.map((item) => (
            <li key={item.label}>
              <button type="button" role="menuitem" className={ROW} onClick={item.onSelect}>
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>,
    document.body,
  );
}
