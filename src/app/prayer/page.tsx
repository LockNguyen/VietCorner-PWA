import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import PrayerBoard from "@/features/prayer/components/PrayerBoard";
import { getLatestRequests } from "@/features/prayer/server/queries";
import { MANAGE_PRAYER_REMINDERS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// The whole church's requests, newest first.
export default async function PrayerPage() {
  const supabase = await createClient();
  const [user, requests, permissions] = await Promise.all([
    getCurrentUser(supabase), // AUTH
    getLatestRequests(supabase),
    getMyPermissions(supabase), // PERMISSIONS
  ]);
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types

  return (
    <>
      <PageHeader title={SHELL_STRINGS.prayerTab} />
      <PrayerBoard
        initialRequests={requests}
        userId={user.id} // keys the "prayed an hour ago" memory on a shared phone
        canManageReminders={permissions.includes(MANAGE_PRAYER_REMINDERS)}
      />
    </>
  );
}
