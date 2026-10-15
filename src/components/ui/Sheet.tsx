import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "./IconButton";

type Props = { title: string; closeLabel: string; onClose: () => void; children: ReactNode }; // closeLabel: what a screen reader calls the X

// A short choice or a few details, rising from the bottom over the screen. Open for as long as it is rendered.
// The X at the top right, Escape and a tap outside it call `onClose`; a sheet has no Close button of its own.
// It rises the way an iPhone's sheets do (the `rise` and `fade` tokens in globals.css).
export default function Sheet({ title, closeLabel, onClose, children }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40 motion-safe:animate-fade" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-20 mx-auto max-h-dvh max-w-column overflow-y-auto rounded-t-control bg-surface pb-safe motion-safe:animate-rise"
        >
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="pt-3 text-body font-semibold text-ink">{title}</Dialog.Title>
              <div className="-me-3 -mt-1">
                <IconButton label={closeLabel} onClick={onClose}>
                  <X />
                </IconButton>
              </div>
            </div>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
