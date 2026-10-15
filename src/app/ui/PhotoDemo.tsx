"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Lightbox from "@/components/ui/Lightbox";
import PhotoStrip from "@/components/ui/PhotoStrip";
import PhotoThumb from "@/components/ui/PhotoThumb";
import Thumbnail from "@/components/ui/Thumbnail";

// Seven stand-in pictures drawn here, so the showcase needs no storage: a wide, a tall and a square one
// among them, because the strip crops and the large view must not.
const SHAPES = [
  [400, 300], [300, 400], [400, 400], [400, 250], [250, 400], [400, 300], [300, 300],
];
const PICTURES = SHAPES.map(([width, height], index) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="hsl(${index * 50} 55% 55%)"/><text x="50%" y="50%" font-size="80" fill="white" text-anchor="middle" dominant-baseline="central">${index + 1}</text></svg>`,
  )}`,
  caption: index % 2 === 0 ? `12 October 2026 · Dã ngoại bên hồ, hình ${index + 1}` : undefined,
}));

// A row tile holding a picture, then a real strip and a real large view, so the crop, the fade, the
// sideways scroll, the arrows and the dark overlay can be seen on the showcase page.
export default function PhotoDemo() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Thumbnail src={PICTURES[1].src} />
      <PhotoStrip>
        {PICTURES.map((picture, index) => (
          <PhotoThumb key={index} src={picture.src} alt={`Picture ${index + 1}`} onClick={() => setOpen(index)} />
        ))}
      </PhotoStrip>
      {open !== null && (
        <Lightbox
          src={PICTURES[open].src}
          alt={`Picture ${open + 1}`}
          caption={PICTURES[open].caption}
          labels={{ previous: "Previous photo", next: "Next photo", close: "Close", download: "Save to phone" }}
          onDownload={() => {}}
          onPrevious={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < PICTURES.length - 1 ? () => setOpen(open + 1) : undefined}
          onClose={() => setOpen(null)}
        >
          <Button variant="danger" onClick={() => setOpen(null)}>Remove this photo</Button>
        </Lightbox>
      )}
    </>
  );
}
