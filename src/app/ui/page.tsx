import { notFound } from "next/navigation";
import { Bot, CalendarDays, Check, ChevronLeft, HandHeart, House, Mic, Settings, Square, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Banner from "@/components/ui/Banner";
import Bubble from "@/components/ui/Bubble";
import BubbleRun from "@/components/ui/BubbleRun";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import IconButton from "@/components/ui/IconButton";
import IconLink from "@/components/ui/IconLink";
import ListRow from "@/components/ui/ListRow";
import LogoMark from "@/components/ui/LogoMark";
import RowLabel from "@/components/ui/RowLabel";
import PhotoTile from "@/components/ui/PhotoTile";
import SectionHeading from "@/components/ui/SectionHeading";
import Select from "@/components/ui/Select";
import SkeletonRow from "@/components/ui/SkeletonRow";
import Spinner from "@/components/ui/Spinner";
import Switch from "@/components/ui/Switch";
import TabBar from "@/components/ui/TabBar";
import Text from "@/components/ui/Text";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import Thumbnail from "@/components/ui/Thumbnail";
import TimeLine from "@/components/ui/TimeLine";
import TopBar from "@/components/ui/TopBar";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";
import BannerDemo from "./BannerDemo";
import ComposerDemo from "./ComposerDemo";
import SheetDemo from "./SheetDemo";

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
          <ListRow href="/ui#10" title="Tiếng Việt" current />
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

      <section className="flex flex-col gap-4">
        <Text as="h2" variant="small" tone="subtle">Field with each control: text, with a problem, several lines, a choice, a date and time, a time; then Switch</Text>
        <Field label="Tên sự kiện · Tiếng Việt"><TextInput defaultValue="Học Kinh Thánh" /></Field>
        <Field label="Tên sự kiện · English" problem="Xin nhập tên sự kiện bằng ít nhất một ngôn ngữ."><TextInput /></Field>
        <Field label="Mô tả"><TextArea rows={3} defaultValue="Mỗi tối thứ Tư lúc 7 giờ tại hội trường chính." /></Field>
        <Field label="Dành cho">
          <Select defaultValue="b">
            <option value="a">Cả hội thánh</option>
            <option value="b">Nhóm Học Kinh Thánh Thanh Niên Tối Thứ Tư</option>
          </Select>
        </Field>
        <Field label="Bắt đầu (giờ hội thánh)"><TextInput type="datetime-local" defaultValue="2026-10-14T19:00" /></Field>
        <Field label="Giờ (giờ hội thánh)"><TextInput type="time" defaultValue="19:00" /></Field>
        <TextInput placeholder="Email" aria-label="Email" />
        <div className="flex flex-col">
          <Switch label="Hằng tuần" defaultChecked />
          <Switch label="Trước 30 phút" />
          <Switch label="Trước 1 ngày" defaultChecked disabled />
        </div>
      </section>

      <section>
        <Text as="h2" variant="small" tone="subtle">Rows as the admin screens compose them: a request, a reminder, a date on and off; then a group's name</Text>
        <ul>
          <ListRow title="Nguyễn Văn An" subtitle="Nhóm Thanh Niên" trailing={<><Button>Duyệt</Button><Button variant="quiet">Từ chối</Button></>} />
          <ListRow title="Nhóm Thanh Niên" subtitle="Thứ Tư · 19:00" trailing={<Button variant="quiet">Gỡ bỏ</Button>} />
          <ListRow title="Thứ Tư, 14 tháng 10, 19:00" trailing={<Button variant="quiet">Hủy</Button>} />
          <ListRow title="Thứ Tư, 21 tháng 10, 19:00" tone="off" trailing={<Button variant="quiet">Hoàn tác</Button>} />
        </ul>
        <div className="flex gap-2 px-3 pt-3">
          <TextInput defaultValue="Nhóm Học Kinh Thánh" aria-label="Tên nhóm" />
          <Button variant="quiet">Lưu</Button>
          <Button variant="danger">Gỡ bỏ</Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">Sheet, LogoMark, Avatar</Text>
        <SheetDemo />
        <LogoMark />
        <Avatar />
      </section>

      <section className="flex flex-col gap-4">
        <Text as="h2" variant="small" tone="subtle">A conversation: TimeLine, BubbleRun (theirs, mine), Bubble (a long one, a failed one, one still coming); then prayer requests: others' with the Pray chip on the corner (idle, done), my own; Composer is held above the tabs</Text>
        <TimeLine>Th 4, 14 thg 10, 19:00</TimeLine>
        <BubbleRun side="theirs" name="Nguyễn Văn An" avatar={<Avatar />}>
          <Bubble tone="theirs">Chào cả nhà</Bubble>
          <Bubble tone="theirs">Tối nay học Kinh Thánh lúc 7 giờ tại hội trường chính, xin mọi người nhớ mang theo sách và đến sớm mười phút.</Bubble>
        </BubbleRun>
        <BubbleRun side="mine">
          <Bubble tone="mine">Cảm ơn anh</Bubble>
          <Bubble tone="mine">Tôi sẽ đến, và sẽ đưa thêm hai người bạn mới cùng tham dự buổi học tối nay.</Bubble>
        </BubbleRun>
        <BubbleRun side="theirs">
          <Bubble tone="failed">Không kết nối được. Xin thử lại.</Bubble>
          <Button variant="text">Thử lại</Button>
          <Bubble tone="theirs"><Spinner /></Bubble>
        </BubbleRun>
        <TimeLine>Tuần này</TimeLine>
        <BubbleRun side="theirs" name="Nguyễn Văn An" avatar={<Avatar />}>
          <div className="flex w-full flex-col items-start pb-6">
            <Bubble tone="theirs" corner={<Chip>🙏 Cầu nguyện</Chip>}>Xin cầu nguyện cho mẹ tôi đang nằm viện sau ca mổ tuần trước.</Bubble>
          </div>
          <div className="flex w-full flex-col items-start pb-6">
            <Bubble tone="theirs" corner={<Chip tone="done" disabled>🙏 Đã cầu nguyện</Chip>}>Amen</Bubble>
          </div>
        </BubbleRun>
        <BubbleRun side="theirs" name="Trần Thị Bình (bạn)" avatar={<Avatar />}>
          <Bubble tone="theirs" onClick={undefined}>Xin cầu nguyện cho kỳ thi của con trai tôi.</Bubble>
        </BubbleRun>
        <ComposerDemo />
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">IconButton: action, filled and danger at the large size, disabled</Text>
        <div className="flex items-center gap-2">
          <IconButton label="Send" tone="action"><Check /></IconButton>
          <IconButton label="Speak" tone="filled" size="large"><Mic className="size-8" /></IconButton>
          <IconButton label="Stop" tone="danger" size="large"><Square className="size-8" /></IconButton>
          <IconButton label="Busy" tone="filled" size="large" disabled><Spinner /></IconButton>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">EmptyState: alone, with a next step</Text>
        <EmptyState message="Không có sự kiện nào trong vài tuần tới." />
        <EmptyState message="Xin tham gia một nhóm trước."><Button>Xem các nhóm</Button></EmptyState>
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
