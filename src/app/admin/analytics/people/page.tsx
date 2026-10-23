import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PeopleStatsList from "@/features/analytics/components/PeopleStatsList";
import RangePicker from "@/features/analytics/components/RangePicker";
import { getPeopleStats } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { getNames } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";

// Each person who used the app in the period: visits, screens, time, last seen. A row opens their timeline.
export default async function AnalyticsPeoplePage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const rows = await getPeopleStats(supabase, sinceOf(days));
  const names = await getNames(supabase, rows.map((row) => row.user_id)); // PROFILES

  return (
    <>
      <PageHeader title={STRINGS.peopleView} backHref={`/admin/analytics?days=${days}`} />
      <RangePicker days={days} path="/admin/analytics/people" />
      <PeopleStatsList rows={rows} names={names} days={days} />
    </>
  );
}
