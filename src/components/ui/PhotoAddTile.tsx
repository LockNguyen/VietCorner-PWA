import { Plus } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

const TILE =
  "flex aspect-square w-full items-center justify-center rounded-thumb bg-fill text-action " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// The first square in a `PhotoStrip`, the same size as a `PhotoThumb`, with a + that adds a picture.
// `label` is what a screen reader says for the +.
export default function PhotoAddTile({ label, ...button }: Props) {
  return (
    <li className="w-3/10 shrink-0">
      <button type="button" {...button} aria-label={label} className={TILE}>
        <Plus className="size-10" />
      </button>
    </li>
  );
}
