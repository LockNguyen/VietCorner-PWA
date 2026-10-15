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
// A picture at the size of the small tile that starts a row (events, groups).
// why 400: the tile is 88 points wide; 400 pixels keeps it sharp on a 3x phone screen, at about 30 KB.
export function shrinkToThumbnail(file: Blob): Promise<Blob> {
  return shrinkImage(file, 400, 0.7);
}
