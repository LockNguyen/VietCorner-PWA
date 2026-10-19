// Cuts a square out of a picture and makes it a small JPEG, in the browser, before upload: the part a person
// framed when choosing their own picture. Small for the same reasons as shrinkImage.ts.

// The square to keep, in the picture's own pixels (what the cropper reports).
export type CropArea = { x: number; y: number; width: number; height: number };

// Returns that square as a `side` × `side` JPEG. Turned the right way up: `createImageBitmap` reads the
// camera's orientation note by default, as the cropper's preview does, so both see the same picture.
export async function cropToSquare(file: Blob, area: CropArea, side: number): Promise<Blob> {
  const picture = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  canvas.getContext("2d")!.drawImage(picture, area.x, area.y, area.width, area.height, 0, 0, side, side);
  picture.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("could not crop the picture"))), "image/jpeg", 0.85);
  });
}
