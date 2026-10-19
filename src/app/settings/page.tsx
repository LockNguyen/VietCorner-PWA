import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import AccountSection from "@/features/auth/components/AccountSection"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import LanguageToggle from "@/features/i18n/components/LanguageToggle"; // I18N
import AvatarSection from "@/features/profiles/components/AvatarSection"; // PROFILES
import NameSection from "@/features/profiles/components/NameSection"; // PROFILES
import { getMyAvatar, getMyProfile, getMyRequestedName } from "@/features/profiles/server/queries"; // PROFILES
import NotificationSection from "@/features/push/components/NotificationSection"; // PUSH
import TextSizeChoice from "@/features/text-size/components/TextSizeChoice"; // TEXT-SIZE
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  // PROFILES: my name, the one I asked for if a manager has yet to answer, and my picture.
  const [profile, requestedName, avatarPath] = user
    ? await Promise.all([getMyProfile(supabase, user.id), getMyRequestedName(supabase, user.id), getMyAvatar(supabase, user.id)])
    : [null, null, null];

  return (
    <>
      <PageHeader title={SHELL_STRINGS.settingsTab} backHref="/" />
      {user && <AvatarSection userId={user.id} avatarPath={avatarPath} />} {/* PROFILES */}
      {profile && <NameSection name={profile.name} requestedName={requestedName} />} {/* PROFILES */}
      <NotificationSection /> {/* PUSH */}
      <AccountSection email={user?.email ?? ""} /> {/* AUTH */}
      <TextSizeChoice /> {/* TEXT-SIZE */}
      <LanguageToggle /> {/* I18N */}
    </>
  );
}
