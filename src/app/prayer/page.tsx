import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import { getGroups } from "@/features/groups/server/queries";
import PrayerBoard from "@/features/prayer/components/PrayerBoard";
import { getLatestRequests } from "@/features/prayer/server/queries";
import { createClient } from "@/lib/supabase/server";

// Requests from every group this member joined, newest first. This page is where `groups` and `prayer`
// meet: it asks groups which ones I am in and hands that list to the composer, so neither imports the other.
export default async function PrayerPage() {
  const supabase = await createClient();
  const [user, groups, requests] = await Promise.all([
    getCurrentUser(supabase), // AUTH
    getGroups(supabase),
    getLatestRequests(supabase),
  ]);
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types

  return (
    <>
      <PageHeader title={SHELL_STRINGS.prayerTab} />
      <PrayerBoard
        initialRequests={requests}
        groups={groups.filter((group) => group.joined).map(({ id, name }) => ({ id, name }))}
        userId={user.id} // keys the "prayed an hour ago" memory on a shared phone
      />
    </>
  );
}
