import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { src: string; alt: string };

// One small square picture in a `PhotoStrip`, cropped to fill its square. A button: tapping it is how the
// picture is opened. Three tenths of the strip wide, so the fourth one shows its edge.
export default function PhotoThumb({ src, alt, ...button }: Props) {
  return (
    <li className="w-3/10 shrink-0">
      <button
        {...button}
        className="block aspect-square w-full overflow-hidden rounded-thumb bg-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        {/* A plain <img>: the address is a short-lived signed one, which an image optimiser could not fetch later. */}
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      </button>
    </li>
  );
}
