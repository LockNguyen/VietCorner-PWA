import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import AvatarSection from "@/features/profiles/components/AvatarSection";
import { getMyAvatar } from "@/features/profiles/server/queries";
import { STRINGS } from "@/features/profiles/strings";
import { createClient } from "@/lib/supabase/server";

// Settings > Picture: opened from the camera on my picture at the top of Settings.
export default async function SettingsPhotoPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase); // AUTH
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types
  const avatarPath = await getMyAvatar(supabase, user.id);

  return (
    <>
      <PageHeader title={STRINGS.pictureHeading} backHref="/settings" />
      <AvatarSection userId={user.id} avatarPath={avatarPath} />
    </>
  );
}
