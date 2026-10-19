import PageHeader from "@/components/PageHeader";
import StaffDirectory from "@/features/staff/components/StaffDirectory";
import { getStaffSections } from "@/features/staff/server/queries";
import { STRINGS } from "@/features/staff/strings";
import { createClient } from "@/lib/supabase/server";

// Who the church's staff are and how to reach them, opened from its tile on Home. Not a tab: rarely needed.
// Read on the server: RLS lets every approved member see it.
export default async function StaffPage() {
  const supabase = await createClient();
  const sections = await getStaffSections(supabase);

  return (
    <>
      <PageHeader title={STRINGS.title} backHref="/" />
      <StaffDirectory sections={sections} />
    </>
  );
}
