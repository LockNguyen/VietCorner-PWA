import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import AccountSection from "@/features/auth/components/AccountSection"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import LanguageToggle from "@/features/i18n/components/LanguageToggle"; // I18N
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await getCurrentUser(await createClient()); // AUTH

  return (
    <>
      <PageHeader title={SHELL_STRINGS.settingsTab} />
      <AccountSection email={user?.email ?? ""} /> {/* AUTH */}
      <LanguageToggle /> {/* I18N */}
    </>
  );
}
