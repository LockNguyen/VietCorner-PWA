import { ArrowDown, ArrowUp } from "lucide-react";
import type { ButtonCorner } from "../device";

// Where on the screen the arrow sits, just inside the edge the browser's own button is behind.
const PLACES: Record<ButtonCorner, string> = {
  bottom: "bottom-2 left-1/2 -translate-x-1/2",
  bottomRight: "bottom-2 right-3",
  topRight: "top-2 right-3",
};

// A big bouncing arrow at the edge of the page, pointing at the browser's Share (or ⋮) button outside it. The
// page cannot open the Add to Home Screen sheet, and that sheet covers the page, so leading the eye to the
// first button is as far as it can help (the user, 2026-10-20).
export default function ShareArrow({ corner }: { corner: ButtonCorner }) {
  const Arrow = corner === "topRight" ? ArrowUp : ArrowDown;
  return (
    <span aria-hidden className={`pointer-events-none fixed z-30 animate-bounce text-action ${PLACES[corner]}`}>
      <Arrow className="size-12" strokeWidth={3} />
    </span>
  );
}
