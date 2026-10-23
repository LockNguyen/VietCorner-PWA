import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  src: string;
  lazy?: boolean; // fetched only near the screen: a long list's pictures past its first screenful
};

// Every picture in the app (the user, 2026-10-22: one place for how pictures draw). A plain <img>: many addresses
// are short-lived signed ones, which an image optimiser could not fetch later.
// Each move between screens builds the next screen anew from the page the phone kept: the text is there at once,
// every picture is a new element to draw. So that a picture the phone already holds is drawn in that first frame
// (the user's iPhone, 2026-10-22: the grey under every picture flashed at each tab switch):
// - `decoding="sync"`: decoded before the frame is shown, not a moment after.
// - loaded at once by default. Safari checks a `loading="lazy"` picture's place on screen only after drawing,
//   even one it already holds, so it came a few frames late. Lazy is for a long list of large pictures only, past
//   its first screenful (`lazy`): there it saves a slow connection the pictures nobody scrolled to.
export default function Picture({ alt = "", lazy = false, ...picture }: Props) {
  return <img decoding="sync" loading={lazy ? "lazy" : "eager"} alt={alt} {...picture} />;
}
