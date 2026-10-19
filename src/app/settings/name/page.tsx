import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import NameSection from "@/features/profiles/components/NameSection";
import { getMyProfile, getMyRequestedName } from "@/features/profiles/server/queries";
import { STRINGS } from "@/features/profiles/strings";
import { createClient } from "@/lib/supabase/server";

// Settings > Name: my name, and the one waiting for a manager's answer, if any.
export default async function SettingsNamePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types
  const [profile, requestedName] = await Promise.all([getMyProfile(supabase, user.id), getMyRequestedName(supabase, user.id)]);

  return (
    <>
      <PageHeader title={STRINGS.nameField} backHref="/settings" />
      {profile && <NameSection name={profile.name} requestedName={requestedName} />}
    </>
  );
}
