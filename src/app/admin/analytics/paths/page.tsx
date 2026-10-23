import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PathList from "@/features/analytics/components/PathList";
import RangePicker from "@/features/analytics/components/RangePicker";
import { getPathStats } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// How people move through the app: from which screen, by which tap, to which screen.
export default async function AnalyticsPathsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const rows = await getPathStats(supabase, sinceOf(days));

  return (
    <>
      <PageHeader title={STRINGS.pathsView} backHref={`/admin/analytics?days=${days}`} />
      <RangePicker days={days} path="/admin/analytics/paths" />
      <PathList rows={rows} days={days} />
    </>
  );
}
