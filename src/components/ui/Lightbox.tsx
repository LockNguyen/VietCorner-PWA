import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "./IconButton";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  labels: { previous: string; next: string; close: string }; // what a screen reader calls the three buttons
  onPrevious?: () => void; // left out at the first picture: the arrow is then not drawn
  onNext?: () => void; // left out at the last one
  onClose: () => void;
  children?: ReactNode; // what can be done with this picture, under its caption
};

// One picture, large, over a darkened screen, with arrows to the pictures either side of it.
// Open for as long as it is rendered. Escape and the X call `onClose`.
export default function Lightbox({ src, alt, caption, labels, onPrevious, onNext, onClose, children }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-ink/90" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4">
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          {/* A plain <img>: the address is a short-lived signed one, which an image optimiser could not fetch later. */}
          <img src={src} alt={alt} className="max-h-3/4 max-w-full rounded-thumb object-contain" />
          {caption && <p className="text-center text-body text-on-action wrap-anywhere">{caption}</p>}
          {children}

          <div className="absolute end-2 top-2 pt-safe">
            <IconButton tone="filled" label={labels.close} onClick={onClose}>
              <X />
            </IconButton>
          </div>
          {onPrevious && (
            <div className="absolute start-2 top-1/2 -translate-y-1/2">
              <IconButton tone="filled" label={labels.previous} onClick={onPrevious}>
                <ChevronLeft />
              </IconButton>
            </div>
          )}
          {onNext && (
            <div className="absolute end-2 top-1/2 -translate-y-1/2">
              <IconButton tone="filled" label={labels.next} onClick={onNext}>
                <ChevronRight />
              </IconButton>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
