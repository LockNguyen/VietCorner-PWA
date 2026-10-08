import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
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
        <Text as="h2" variant="small" tone="subtle">Spinner</Text>
        <Text tone="subtle"><Spinner /> takes the colour of its text</Text>
      </section>
    </div>
  );
}
