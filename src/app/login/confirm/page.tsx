import ConfirmLink from "@/features/auth/components/ConfirmLink";
import SignedOutFrame from "@/features/auth/components/SignedOutFrame";

type Props = { searchParams: Promise<{ attempt?: string; key?: string }> };

// Where a sign-in email's link leads (sign-in and a new account alike): `/login/confirm?attempt=…&key=…` (Supabase's
// template adds its own `token_hash`, which is not used: server/sendLink.ts). Under `/login`, so the
// proxy lets a signed-out browser reach it. Opening it changes nothing by itself (the auth README).
// Often a browser the app was never opened in, so it starts in the default language, with the other one
// at the top right as everywhere signed out.
export default async function ConfirmLinkPage({ searchParams }: Props) {
  const { attempt, key } = await searchParams;

  return (
    <SignedOutFrame>
      <ConfirmLink attempt={attempt} linkKey={key} />
    </SignedOutFrame>
  );
}
