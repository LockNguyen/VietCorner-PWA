import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import ListGroup from "@/components/ui/ListGroup";
import EmailRow from "@/features/auth/components/EmailRow"; // AUTH
import SignOutButton from "@/features/auth/components/SignOutButton"; // AUTH
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import LanguageRow from "@/features/i18n/components/LanguageRow"; // I18N
import NameRow from "@/features/profiles/components/NameRow"; // PROFILES
import ProfileHeader from "@/features/profiles/components/ProfileHeader"; // PROFILES
import { getMyAvatar, getMyProfile } from "@/features/profiles/server/queries"; // PROFILES
import NotificationRow from "@/features/push/components/NotificationRow"; // PUSH
import TextSizeRow from "@/features/text-size/components/TextSizeRow"; // TEXT-SIZE
import { createClient } from "@/lib/supabase/server";

// Settings the way Messenger lays them out (the user, 2026-10-19): me at the top, then rows in rounded groups,
// each showing its value and sliding in its own screen (/settings/<name>). Sign out is far below, on its own.
export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  const [profile, avatarPath] = user
    ? await Promise.all([getMyProfile(supabase, user.id), getMyAvatar(supabase, user.id)]) // PROFILES
    : [null, null];

  return (
    <>
      <PageHeader title={SHELL_STRINGS.settingsTab} backHref="/" />
      <div className="flex flex-col gap-6 px-3 pt-4">
        {profile && <ProfileHeader name={profile.name} avatarPath={avatarPath} />} {/* PROFILES */}
        <ListGroup>
          {profile && <NameRow name={profile.name} />} {/* PROFILES */}
          {user?.email && <EmailRow email={user.email} />} {/* AUTH */}
          <NotificationRow /> {/* PUSH */}
        </ListGroup>
        <ListGroup>
          <TextSizeRow /> {/* TEXT-SIZE */}
          <LanguageRow /> {/* I18N */}
        </ListGroup>
        {/* Far from the rows, so a slip of the thumb never lands on it (the user, 2026-10-19). */}
        <div className="flex flex-col pt-16">
          <SignOutButton /> {/* AUTH */}
        </div>
      </div>
    </>
  );
}
