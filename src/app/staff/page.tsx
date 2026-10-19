import PageHeader from "@/components/PageHeader";
import StaffDirectory from "@/features/staff/components/StaffDirectory";
import { STRINGS } from "@/features/staff/strings";

// Who the church's staff are and how to reach them, opened from its tile on Home. Not a tab: rarely needed.
export default function StaffPage() {
  return (
    <>
      <PageHeader title={STRINGS.title} backHref="/" />
      <StaffDirectory />
    </>
  );
}
