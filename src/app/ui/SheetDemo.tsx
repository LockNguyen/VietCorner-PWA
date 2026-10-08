"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";

// Opens a real sheet, so its rise, its overlay and how it closes can be seen on the showcase page.
export default function SheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        Open a sheet
      </Button>
      {open && (
        <Sheet title="Tùy chọn cho lời xin này" onClose={() => setOpen(false)}>
          <Button onClick={() => setOpen(false)}>Đã được nhậm lời</Button>
          <Button variant="quiet" onClick={() => setOpen(false)}>Sửa</Button>
          <Button variant="danger" onClick={() => setOpen(false)}>Xóa</Button>
          <Button variant="text" onClick={() => setOpen(false)}>Hủy</Button>
        </Sheet>
      )}
    </>
  );
}
