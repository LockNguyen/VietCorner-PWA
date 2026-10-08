import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import AccountSection from "@/features/auth/components/AccountSection"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import LanguageToggle from "@/features/i18n/components/LanguageToggle"; // I18N
import NameSection from "@/features/profiles/components/NameSection"; // PROFILES
import { getMyProfile } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  const profile = user ? await getMyProfile(supabase, user.id) : null; // PROFILES

  return (
    <>
      <PageHeader title={SHELL_STRINGS.settingsTab} backHref="/" />
      {profile && <NameSection name={profile.name} />} {/* PROFILES */}
      <AccountSection email={user?.email ?? ""} /> {/* AUTH */}
      <LanguageToggle /> {/* I18N */}
    </>
  );
}
