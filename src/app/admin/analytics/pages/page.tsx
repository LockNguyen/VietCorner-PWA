import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PageStatsList from "@/features/analytics/components/PageStatsList";
import RangePicker from "@/features/analytics/components/RangePicker";
import { getPageStats } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// Each screen of the app: how often it is opened, by whom, for how long, and how fast it appears.
export default async function AnalyticsPagesPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const rows = await getPageStats(supabase, sinceOf(days));

  return (
    <>
      <PageHeader title={STRINGS.pagesView} backHref={`/admin/analytics?days=${days}`} />
      <RangePicker days={days} path="/admin/analytics/pages" />
      <PageStatsList rows={rows} days={days} />
    </>
  );
}
