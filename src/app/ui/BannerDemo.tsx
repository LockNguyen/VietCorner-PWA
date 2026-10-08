"use client";

import Button from "@/components/ui/Button";
import { useBanner } from "@/lib/useBanner";

// Raises real banners, so their timing and stacking can be seen on the showcase page.
export default function BannerDemo() {
  const showBanner = useBanner();

  return (
    <div className="flex flex-col gap-2">
      <Button variant="quiet" onClick={() => showBanner({ kind: "success", message: "Đã lưu" })}>
        Raise a success (2 s)
      </Button>
      <Button variant="quiet" onClick={() => showBanner({ kind: "error", message: "Không lưu được. Xin thử lại." })}>
        Raise an error (8 s)
      </Button>
      <Button
        variant="quiet"
        onClick={() => {
          showBanner({ kind: "error", message: "Nhóm này đã có lời nhắc vào ngày và giờ đó." });
          showBanner({ kind: "error", message: "Không lưu được. Xin thử lại." });
          showBanner({ kind: "success", message: "Đã chia sẻ", seconds: 8 });
        }}
      >
        Raise three at once (a stack)
      </Button>
    </div>
  );
}
