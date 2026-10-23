import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RangePicker from "@/features/analytics/components/RangePicker";
import UsageList from "@/features/analytics/components/UsageList";
import { getUsageStats } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { getNames } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";

// What each person's visits ask of Supabase and of the app's own server, per visit.
export default async function AnalyticsUsagePage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const rows = await getUsageStats(supabase, sinceOf(days));
  const names = await getNames(supabase, rows.map((row) => row.user_id)); // PROFILES

  return (
    <>
      <PageHeader title={STRINGS.usageView} backHref={`/admin/analytics?days=${days}`} />
      <RangePicker days={days} path="/admin/analytics/usage" />
      <UsageList rows={rows} days={days} names={names} />
    </>
  );
}
