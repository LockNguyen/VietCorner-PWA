import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import type { ReactNode } from "react";
import { useSwipe } from "./hooks/useSwipe";
import IconButton from "./IconButton";

type Props = {
  src: string;
  alt: string;
  caption?: string; // between the arrows, under the picture (its date, its words)
  labels: { previous: string; next: string; close: string; download: string }; // what a screen reader calls each button
  onPrevious?: () => void; // left out at the first picture: the arrow is then not drawn
  onNext?: () => void; // left out at the last one
  onDownload?: () => void; // left out: no download button
  onClose: () => void;
  children?: ReactNode; // what can be done with this picture, at the bottom
};

// The rows above and below take the picture's width without widening it: zero width of their own, at least
// as wide as the column, which the picture alone sets.
const ROW = "flex w-0 min-w-full items-center";

// One picture, large, over a darkened screen. Above its top-right corner: download and a white X. Under it, on
// one line with its caption: the arrows to the pictures either side, at its left and right edges. A tap on the
// dark around it, Escape or the X closes it. A swipe left shows the next picture, a swipe right the one before.
// Open for as long as it is rendered.
export default function Lightbox({ src, alt, caption, labels, onPrevious, onNext, onDownload, onClose, children }: Props) {
  const swipe = useSwipe(onNext, onPrevious);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-ink/90" />
        <Dialog.Content
          aria-describedby={undefined}
          onClick={(event) => event.target === event.currentTarget && onClose()} // the dark, not the picture
          {...swipe}
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <div className="flex max-w-full flex-col gap-1">
            <div className={`${ROW} justify-end`}>
              {onDownload && (
                <IconButton tone="onDark" label={labels.download} onClick={onDownload}>
                  <Download />
                </IconButton>
              )}
              <IconButton tone="onDark" label={labels.close} onClick={onClose}>
                <X />
              </IconButton>
            </div>
            {/* A plain <img>: the address is a short-lived signed one, which an image optimiser could not fetch later. */}
            <img src={src} alt={alt} className="max-h-sheet max-w-full rounded-thumb object-contain" />
            <div className={`${ROW} gap-2`}>
              <span className="inline-flex size-touch shrink-0">
                {onPrevious && (
                  <IconButton tone="onDark" label={labels.previous} onClick={onPrevious}>
                    <ChevronLeft />
                  </IconButton>
                )}
              </span>
              <p className="flex-1 text-center text-small text-on-action wrap-anywhere">{caption}</p>
              <span className="inline-flex size-touch shrink-0">
                {onNext && (
                  <IconButton tone="onDark" label={labels.next} onClick={onNext}>
                    <ChevronRight />
                  </IconButton>
                )}
              </span>
            </div>
            {children && <div className={`${ROW} flex-col`}>{children}</div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
