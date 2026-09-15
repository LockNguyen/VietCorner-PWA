import PageHeader from "@/components/PageHeader";
import AccountSection from "@/features/auth/components/AccountSection"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import { createClient } from "@/lib/supabase/server"; // AUTH

export default async function SettingsPage() {
  const user = await getCurrentUser(await createClient()); // AUTH

  return (
    <>
      <PageHeader title="Settings" />
      <AccountSection email={user?.email ?? ""} /> {/* AUTH */}
      <p className="p-4 text-gray-500">Language and notification settings go here.</p>
    </>
  );
}
