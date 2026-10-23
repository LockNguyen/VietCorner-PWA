// Makes a photo small enough to store and to send over a phone connection, in the browser, before upload.
//
// Why here and not on the server: a phone's photo is 3 to 8 MB. Sending that only to shrink it would cost
// the member a minute and their data, and our free storage would fill within weeks. Supabase's own image
// resizing is a paid feature. Every bucket has its own size limit and takes JPEGs only (each feature's
// schema.sql), so a caller that skips this is refused by the server, not trusted.

// Returns the picture as a JPEG whose longer side is at most `maxSide` pixels. Never enlarges.
// Turned the right way up: `createImageBitmap` reads the camera's orientation note by default.
export async function shrinkImage(file: Blob, maxSide: number, quality: number): Promise<Blob> {
  const picture = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(picture.width, picture.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(picture.width * scale);
  canvas.height = Math.round(picture.height * scale);
  canvas.getContext("2d")!.drawImage(picture, 0, 0, canvas.width, canvas.height);
  picture.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("could not shrink the picture"))), "image/jpeg", quality);
  });
}
// why: from nearly untouched down to plainly softened; tried in this order, so a picture keeps the best quality
// that fits. Below 0.65 a JPEG shows blocks in skies and faces.
const QUALITIES = [0.92, 0.85, 0.75, 0.65];
// why: a photo full of detail (leaves, brick, a crowd) can stay over the limit at every quality; a little smaller
// each time keeps it sharp where a lower quality would show blocks. 400 is the smallest any screen draws.
const SMALLER = 0.8;
const SMALLEST_SIDE = 400;

// The sizes and qualities `shrinkUnder` tries, in order: every quality at full size, then the same a fifth smaller,
// and so on down to SMALLEST_SIDE. Pure, so the order is tested without a canvas.
export function shrinkSteps(maxSide: number): { side: number; quality: number }[] {
  const steps = [];
  for (let side = maxSide; side >= SMALLEST_SIDE; side = Math.round(side * SMALLER)) {
    for (const quality of QUALITIES) steps.push({ side, quality });
  }
  return steps;
}

// Returns the picture as a JPEG at most `maxSide` pixels long, at the first size and quality whose file is under
// `maxBytes`. Before 2026-10-22 a picture still over at the lowest quality was sent anyway and the bucket
// refused it ("The object exceeded the maximum allowed size", the user's upload of a busy outdoor photo).
// Only a picture over even at SMALLEST_SIDE is still sent as it is: no real photo comes near.
export async function shrinkUnder(file: Blob, maxSide: number, maxBytes: number): Promise<Blob> {
  let shrunk = file;
  for (const { side, quality } of shrinkSteps(maxSide)) {
    shrunk = await shrinkImage(file, side, quality);
    if (shrunk.size <= maxBytes) return shrunk;
  }
  return shrunk;
}

// A picture at the size of the small tile that starts a row (events, groups).
// why 400: the tile is 88 points wide; 400 pixels keeps it sharp on a 3x phone screen, at about 30 KB.
export function shrinkToThumbnail(file: Blob): Promise<Blob> {
  return shrinkImage(file, 400, 0.7);
}
