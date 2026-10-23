import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ProblemLists from "@/features/analytics/components/ProblemLists";
import RangePicker from "@/features/analytics/components/RangePicker";
import { getProblems } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// What spoils the app for people: errors, slow requests, taps that got no answer, slow screens.
export default async function AnalyticsProblemsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const problems = await getProblems(supabase, sinceOf(days)); // its four reports, read together

  return (
    <>
      <PageHeader title={STRINGS.problemsView} backHref={`/admin/analytics?days=${days}`} />
      <RangePicker days={days} path="/admin/analytics/problems" />
      <ProblemLists problems={problems} days={days} />
    </>
  );
}
