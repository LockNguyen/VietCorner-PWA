"use client";

import { useState } from "react";
import Text from "@/components/ui/Text";
import ImageCropper from "@/components/ui/ImageCropper";

// The showcase's cropper, live: drag and pinch a sample photo; the square it would keep is printed under it.
export default function CropperDemo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState("");

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2" variant="small" tone="subtle">ImageCropper: drag, pinch</Text>
      <ImageCropper
        src="/images/home/groups.png"
        position={position}
        zoom={zoom}
        onPositionChange={setPosition}
        onZoomChange={setZoom}
        onCropped={(kept) => setArea(`${kept.x},${kept.y} ${kept.width}×${kept.height}`)}
      />
      <Text variant="small" tone="subtle">Kept: {area}</Text>
    </section>
  );
}
