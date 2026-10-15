import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import PrayerBoard from "@/features/prayer/components/PrayerBoard";
import { getLatestRequests } from "@/features/prayer/server/queries";
import { createClient } from "@/lib/supabase/server";

// The whole church's requests, newest first.
export default async function PrayerPage() {
  const supabase = await createClient();
  const [user, requests] = await Promise.all([
    getCurrentUser(supabase), // AUTH
    getLatestRequests(supabase),
  ]);
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types

  return (
    <>
      <PageHeader title={SHELL_STRINGS.prayerTab} />
      <PrayerBoard
        initialRequests={requests}
        userId={user.id} // keys the "prayed an hour ago" memory on a shared phone
      />
    </>
  );
}
