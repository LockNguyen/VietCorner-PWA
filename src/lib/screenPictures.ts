// Pictures of the screens left behind, to show under the screen while a swipe back moves it (the user, 2026-10-23:
// "the last page should already be there", not a white page). A browser draws one page at a time, so the picture is
// a copy of the screen's box as it was left: its words, pictures and scroll position, with nothing in it that works.
// It is shown only during the drag; the real screen replaces it a moment after letting go (src/lib/useSwipeBack.ts).
// Pure DOM, no React: src/components/Navigation.tsx takes the pictures, the swipe shows them.

export type ScreenPicture = { copy: HTMLElement; scrollTop: number };

const pictures = new Map<string, ScreenPicture>();

// A copy of `screen` as it is now. Taken on every tap, because a tap is what leaves a screen and by the time the
// next screen is known the old one is gone; only the copy of a screen actually left is kept (`keepPicture`).
export function copyOf(screen: HTMLElement): ScreenPicture {
  const copy = screen.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id"); // the real screen keeps its id
  copy.setAttribute("aria-hidden", "true"); // a picture: nothing to read or press
  copy.inert = true;
  return { copy, scrollTop: screen.scrollTop };
}

export function keepPicture(path: string, picture: ScreenPicture) {
  pictures.set(path, picture);
}

export function pictureOf(path: string): ScreenPicture | undefined {
  return pictures.get(path);
}

// Only the screens a swipe can still go back to are kept (the trail, and Home); the rest are let go.
export function keepPicturesOf(paths: string[]) {
  for (const path of pictures.keys()) if (!paths.includes(path)) pictures.delete(path);
}
