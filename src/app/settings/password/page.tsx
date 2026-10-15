import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";
import NewPasswordForm from "@/features/auth/components/NewPasswordForm";
import { isSignInProblem } from "@/features/auth/errors";
import { getCurrentUser } from "@/features/auth/server/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ problem?: string }> };

// Choose a new password. A "Forgot password?" link lands here signed in; Settings links here too.
// `?problem=` is why the last try failed (the new-password route).
export default async function PasswordPage({ searchParams }: Props) {
  const user = await getCurrentUser(await createClient());
  const { problem } = await searchParams;

  return (
    <>
      <PageHeader title={SHELL_STRINGS.settingsTab} backHref="/settings" />
      <NewPasswordForm email={user?.email ?? ""} problem={isSignInProblem(problem) ? problem : null} />
    </>
  );
}
