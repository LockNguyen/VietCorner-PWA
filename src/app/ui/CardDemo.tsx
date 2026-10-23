"use client";

import { Check, Pencil, Users } from "lucide-react";
import { useState } from "react";
import BilingualInput from "@/components/ui/BilingualInput";
import Button from "@/components/ui/Button";
import Bubble from "@/components/ui/Bubble";
import Card from "@/components/ui/Card";
import Celebrate from "@/components/ui/Celebrate";
import Chip from "@/components/ui/Chip";
import CountPill from "@/components/ui/CountPill";
import LiveDot from "@/components/ui/LiveDot";
import MemberCircles from "@/components/ui/MemberCircles";
import { useConfirmTap } from "@/lib/useConfirmTap";

// The showcase's live pieces from the admin-on-the-tabs work: a group card, the bilingual box, and the red
// line that asks once. Sample words only.
export default function CardDemo() {
  const [vi, setVi] = useState("Học Kinh Thánh");
  const [en, setEn] = useState("");
  const [removed, setRemoved] = useState(false);
  const { armed, tap } = useConfirmTap(() => setRemoved(true));
  const [prayed, setPrayed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Card placeholder={<Users className="size-8" />} badge={<LiveDot />} title="Nhóm Thanh Niên" subtitle="Thứ Sáu @ 19:30 · Hội trường">
        <MemberCircles people={[{ initials: "AN", src: "/images/home/prayer.png" }, { initials: "BT" }, { initials: "C" }]} total={12} max={8} label="12 thành viên" />
      </Card>
      <BilingualInput
        top={{ value: vi, onChange: setVi, placeholder: "Tiếng Việt", label: "Tên · Tiếng Việt" }}
        bottom={{ value: en, onChange: setEn, placeholder: "English", label: "Tên · English" }}
      />
      <div className="flex items-center gap-2">
        <Bubble tone="theirs">Xin cầu nguyện cho kỳ thi của con trai tôi.</Bubble>
        {prayed ? (
          <Celebrate burst="+1">
            <Chip tone="done" size="wide" label="Prayed, 4 people prayed" disabled>
              4 <Check aria-hidden />
            </Chip>
          </Celebrate>
        ) : (
          <Chip tone="pray" size="wide" label="Pray, 3 people prayed" onClick={() => setPrayed(true)}>
            3 🙏
          </Chip>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Bubble tone="theirs">Xin cầu nguyện cho mẹ tôi.</Bubble>
        <CountPill label="3 người đã cầu nguyện">3 🙏</CountPill>
        <Chip tone="quiet" size="small" label="Options">
          <Pencil aria-hidden className="size-4" />
        </Chip>
      </div>
      <Button variant="dangerText" onClick={tap}>
        {removed ? "Đã xóa" : armed ? "Bấm lần nữa để xác nhận" : "Xóa sự kiện"}
      </Button>
    </div>
  );
}
