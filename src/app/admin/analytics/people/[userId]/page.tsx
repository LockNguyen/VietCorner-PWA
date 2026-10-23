import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Timeline from "@/features/analytics/components/Timeline";
import { getTimeline } from "@/features/analytics/server/queries";
import { STRINGS } from "@/features/analytics/strings";
import { rangeOf, sinceOf, VIEW_ANALYTICS } from "@/features/analytics/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { getNames } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ userId: string }>; searchParams: Promise<{ days?: string }> };

// One person's timeline for the period: every screen, tap, error and slow request, newest first.
export default async function AnalyticsPersonPage({ params, searchParams }: Props) {
  const { userId } = await params;
  const days = rangeOf((await searchParams).days);
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(VIEW_ANALYTICS)) notFound();
  const [events, names] = await Promise.all([
    getTimeline(supabase, userId, sinceOf(days)),
    getNames(supabase, [userId]), // PROFILES
  ]);

  return (
    <>
      <PageHeader title={names[userId] ?? STRINGS.unknown} backHref={`/admin/analytics/people?days=${days}`} />
      <Timeline events={events} userId={userId} days={days} />
    </>
  );
}
