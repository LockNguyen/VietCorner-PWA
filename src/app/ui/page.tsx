import { notFound } from "next/navigation";
import { Bot, CalendarDays, Check, ChevronLeft, HandHeart, House, Settings, Users } from "lucide-react";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconLink from "@/components/ui/IconLink";
import ListRow from "@/components/ui/ListRow";
import RowLabel from "@/components/ui/RowLabel";
import PhotoTile from "@/components/ui/PhotoTile";
import SectionHeading from "@/components/ui/SectionHeading";
import SkeletonRow from "@/components/ui/SkeletonRow";
import Spinner from "@/components/ui/Spinner";
import TabBar from "@/components/ui/TabBar";
import Text from "@/components/ui/Text";
import Thumbnail from "@/components/ui/Thumbnail";
import TopBar from "@/components/ui/TopBar";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";
import BannerDemo from "./BannerDemo";

const BUTTONS = ["primary", "quiet", "danger", "text"] as const;

// Every shared component in every state, on one page: how the library is reviewed as a whole.
// For admins; open to anyone on a developer's machine. English only: it is a tool, not a screen.
export default async function ShowcasePage() {
  const permissions = await getMyPermissions(await createClient());
  if (permissions.length === 0 && process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">Text</Text>
        <Text variant="tile">Tile title, 20 bold. Tiêu đề ô</Text>
        <Text>Body, 17. Học Kinh Thánh mỗi tối thứ Tư lúc 7 giờ.</Text>
        <Text tone="subtle">Body, subtle. Nhóm Thanh Niên</Text>
        <Text variant="small" tone="subtle">Small, subtle, 14. Sunday Morning Worship</Text>
        <Text variant="small" tone="danger">Small, danger. Something went wrong.</Text>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">Button: rest, disabled, pending, pending with words</Text>
        {BUTTONS.map((variant) => (
          <div key={variant} className="grid grid-cols-2 gap-2">
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} disabled>{variant}</Button>
            <Button variant={variant} pending>{variant}</Button>
            <Button variant={variant} pending pendingLabel="Đang lưu…">{variant}</Button>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">TopBar: a tab's screen, a sub-screen with a long title</Text>
        <TopBar
          title="Sự kiện"
          right={
            <>
              <IconLink href="/ui#1" label="Assistant"><Bot /></IconLink>
              <IconLink href="/ui#2" label="Settings"><Settings /></IconLink>
            </>
          }
        />
        <TopBar
          title="Nhóm Học Kinh Thánh Thanh Niên Tối Thứ Tư"
          left={<IconLink href="/ui#3" label="Back"><ChevronLeft /></IconLink>}
          right={
            <>
              <IconLink href="/ui#4" label="Assistant"><Bot /></IconLink>
              <IconLink href="/ui#5" label="Settings"><Settings /></IconLink>
            </>
          }
        />
      </section>

      <section>
        <Text as="h2" variant="small" tone="subtle">ListRow: link, with a button, with a RowLabel (called off, two-word time, long title), a choice; then SkeletonRow</Text>
        <SectionHeading>Hôm nay</SectionHeading>
        <ul>
          <ListRow href="/ui#6" leading={<Thumbnail><Users /></Thumbnail>} title="Học Kinh Thánh" subtitle="Đã tham gia" />
          <ListRow leading={<Thumbnail><Users /></Thumbnail>} title="Nhóm Thanh Niên" trailing={<Button variant="quiet">Tham gia</Button>} />
          <ListRow href="/ui#7" leading={<><RowLabel>7:00 PM</RowLabel><Thumbnail /></>} title="Youth outing" subtitle="Đã hủy · Riverside Park" tone="off" />
          <ListRow href="/ui#8" leading={<><RowLabel>10:30 AM</RowLabel><Thumbnail /></>} title="Sunday service" subtitle="Main hall" />
          <ListRow href="/ui#9" leading={<><RowLabel>19:00</RowLabel><Thumbnail /></>} title="Một tên sự kiện rất dài để xem dòng chữ xuống hàng như thế nào trên điện thoại" subtitle="Hội trường chính · Sự kiện của nhóm" />
          <ListRow href="/ui#10" title="Tiếng Việt" current trailing={<Check aria-hidden className="shrink-0 text-action" />} />
          <ListRow href="/ui#11" title="English" trailing={null} />
          <SkeletonRow />
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">Banner: success, error, the top of a stack; then the real thing</Text>
        <Banner kind="success" message="Đã lưu" />
        <Banner kind="error" message="Không lưu được. Xin thử lại." />
        <Banner kind="error" message="Nhóm này đã có lời nhắc vào ngày và giờ đó." more={2} />
        <BannerDemo />
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">EmptyState: alone, with a next step</Text>
        <EmptyState message="Không có sự kiện nào trong vài tuần tới." />
        <EmptyState message="Xin tham gia một nhóm trước."><Button>Xem các nhóm</Button></EmptyState>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">IconLink: on the bar, on white</Text>
        <div className="flex gap-2">
          <IconLink href="/ui#12" label="Home" tone="ink"><House /></IconLink>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <Text as="h2" variant="small" tone="subtle">PhotoTile</Text>
        <PhotoTile href="/ui#13" title="Cầu nguyện"><HandHeart className="size-8" /></PhotoTile>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">TabBar: fixed to the bottom of this page, second tab active</Text>
        <TabBar
          tabs={[
            { href: "/ui#home", label: "Trang chủ", icon: <House />, active: false },
            { href: "/ui#events", label: "Sự kiện", icon: <CalendarDays />, active: true },
            { href: "/ui#prayer", label: "Cầu nguyện", icon: <HandHeart />, active: false },
            { href: "/ui#groups", label: "Nhóm", icon: <Users />, active: false },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">Spinner</Text>
        <Text tone="subtle"><Spinner /> takes the colour of its text</Text>
      </section>
    </div>
  );
}
