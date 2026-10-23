import Cropper, { type Area, type Point } from "react-easy-crop";

type Props = {
  src: string; // the picture, as an address (an object URL for a chosen file)
  position: Point;
  zoom: number;
  onPositionChange: (position: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropped: (area: Area) => void; // the square kept, in the picture's own pixels, after each move
};

const BOX = "relative h-72 w-full overflow-hidden rounded-control bg-ink";

// Framing a picture in a circle: drag it to move it, pinch to make it bigger. Built on `react-easy-crop`:
// dragging and pinching by hand, on every phone, is easy to get subtly wrong. Holds no state: the caller does.
export default function ImageCropper({ src, position, zoom, onPositionChange, onZoomChange, onCropped }: Props) {
  return (
    <div className={BOX} data-own-swipe>{/* a drag moves the picture, never goes back (useSwipeBack) */}
      <Cropper
        image={src}
        crop={position}
        zoom={zoom}
        aspect={1}
        cropShape="round"
        showGrid={false}
        onCropChange={onPositionChange}
        onZoomChange={onZoomChange}
        onCropComplete={(_, pixels) => onCropped(pixels)}
      />
    </div>
  );
}
