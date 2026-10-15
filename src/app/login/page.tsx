import Welcome from "@/features/auth/components/Welcome";
import { isSignInProblem } from "@/features/auth/errors";

type Props = { searchParams: Promise<{ problem?: string }> };

// Every signed-out visit lands here, in the browser as well as in the installed app: signing in happens in
// Safari first, where the phone saves and fills in passwords; the install guide follows (root layout).
// `?problem=` is why the last sign-in failed (the sign-in route).
export default async function LoginPage({ searchParams }: Props) {
  const { problem } = await searchParams;
  return <Welcome problem={isSignInProblem(problem) ? problem : null} />;
}
