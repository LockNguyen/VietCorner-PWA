import { notFound } from "next/navigation";
import { Bot, CalendarDays, ChevronLeft, HandHeart, House, Settings, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import IconLink from "@/components/ui/IconLink";
import PhotoTile from "@/components/ui/PhotoTile";
import Spinner from "@/components/ui/Spinner";
import TabBar from "@/components/ui/TabBar";
import Text from "@/components/ui/Text";
import TopBar from "@/components/ui/TopBar";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

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
              <IconLink href="/ui" label="Assistant"><Bot /></IconLink>
              <IconLink href="/ui" label="Settings"><Settings /></IconLink>
            </>
          }
        />
        <TopBar
          title="Nhóm Học Kinh Thánh Thanh Niên Tối Thứ Tư"
          left={<IconLink href="/ui" label="Back"><ChevronLeft /></IconLink>}
          right={
            <>
              <IconLink href="/ui" label="Assistant"><Bot /></IconLink>
              <IconLink href="/ui" label="Settings"><Settings /></IconLink>
            </>
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2" variant="small" tone="subtle">IconLink: on the bar, on white</Text>
        <div className="flex gap-2">
          <IconLink href="/ui" label="Home" tone="ink"><House /></IconLink>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <Text as="h2" variant="small" tone="subtle">PhotoTile</Text>
        <PhotoTile href="/ui" title="Cầu nguyện"><HandHeart className="size-8" /></PhotoTile>
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
