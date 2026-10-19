import HomeTiles from "@/components/HomeTiles";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { managesSomething } from "@/features/permissions/types"; // PERMISSIONS
import LaunchInfo from "@/features/launch-info/components/LaunchInfo"; // LAUNCH-INFO
import { createClient } from "@/lib/supabase/server";

// Home: where the app opens. Three tiles, and a fourth (Admin) for whoever manages something.
export default async function HomePage() {
  const permissions = await getMyPermissions(await createClient()); // PERMISSIONS: read from the token, no trip

  return (
    <>
      <PageHeader title={SHELL_STRINGS.homeTab} />
      {managesSomething(permissions) && <LaunchInfo renderedAt={Date.now()} />} {/* LAUNCH-INFO */}
      <HomeTiles showAdmin={managesSomething(permissions)} />
    </>
  );
}
