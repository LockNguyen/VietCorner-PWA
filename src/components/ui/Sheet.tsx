import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

type Props = { title: string; onClose: () => void; children: ReactNode };

// A short choice or a few details, rising from the bottom over the screen. Open for as long as it is rendered.
// Escape and a tap outside it call `onClose`.
export default function Sheet({ title, onClose, children }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-20 mx-auto max-h-dvh max-w-column overflow-y-auto rounded-t-control bg-surface pb-safe motion-safe:animate-rise"
        >
          <div className="flex flex-col gap-3 p-4">
            <Dialog.Title className="text-body font-semibold text-ink">{title}</Dialog.Title>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
