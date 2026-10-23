import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ActionList from "@/features/analytics/components/ActionList";
import OverviewList from "@/features/analytics/components/OverviewList";
import RangePicker from "@/features/analytics/components/RangePicker";
import ViewLinks from "@/features/analytics/components/ViewLinks";
import { getActionStats, getOverview } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// The dashboard's first screen: the period, its totals, and the deeper screens. Courtesy, not security: the
// database answers nobody without "analytics.view".
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const since = sinceOf(days);
  const [overview, actions] = await Promise.all([getOverview(supabase, since), getActionStats(supabase, since)]);

  return (
    <>
      <PageHeader title={STRINGS.heading} backHref="/admin" />
      <RangePicker days={days} path="/admin/analytics" />
      <OverviewList overview={overview} days={days} />
      <ActionList rows={actions} days={days} />
      <ViewLinks days={days} />
    </>
  );
}
