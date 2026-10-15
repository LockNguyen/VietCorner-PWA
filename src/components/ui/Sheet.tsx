import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { useClosingSheet } from "./hooks/useClosingSheet";
import IconButton from "./IconButton";

type Props = {
  title: string;
  closeLabel: string; // what a screen reader calls the X
  onClose: () => void; // runs after the sheet has slid away: stop rendering it then
  // The content; as a function it is handed `close`, for an action that ends by closing the sheet (Post).
  children: ReactNode | ((close: () => void) => ReactNode);
};

const OVERLAY = "fixed inset-0 z-20 bg-ink/40";
const PANEL =
  "fixed inset-x-0 bottom-0 z-20 mx-auto flex max-h-sheet max-w-column flex-col rounded-t-control bg-surface pb-safe outline-none";
const HANDLE = "mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line";

// A short choice or a few details, rising from the bottom over the screen, as an iPhone's sheets do: it slides
// in, and slides away again on the X, a swipe down, a tap outside or Escape. At most 60% of the screen tall:
// the title and the X stay put, and the rest scrolls under them. Built on `vaul`, which tells a swipe from a
// scroll: telling them apart by hand is easy to get subtly wrong.
export default function Sheet({ title, closeLabel, onClose, children }: Props) {
  const { open, close } = useClosingSheet(onClose);

  return (
    <Drawer.Root open={open} onOpenChange={(nowOpen) => !nowOpen && close()}>
      <Drawer.Portal>
        <Drawer.Overlay className={OVERLAY} />
        <Drawer.Content aria-describedby={undefined} className={PANEL}>
          <div aria-hidden className={HANDLE} />
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-1">
            <Drawer.Title className="pt-3 text-body font-semibold text-ink">{title}</Drawer.Title>
            <div className="-me-3">
              <IconButton label={closeLabel} onClick={close}>
                <X />
              </IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4">
            {typeof children === "function" ? children(close) : children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
