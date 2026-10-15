import ConfirmLink from "@/features/auth/components/ConfirmLink";
import SignedOutFrame from "@/features/auth/components/SignedOutFrame";

type Props = { searchParams: Promise<{ attempt?: string; token_hash?: string }> };

// Where a password-reset email's link leads: `/login/confirm?attempt=…&token_hash=…`. Under `/login`, so the
// proxy lets a signed-out browser reach it. Opening it changes nothing by itself (the auth README).
// Often a browser the app was never opened in, so it starts in the default language, with the other one
// at the top right as everywhere signed out.
export default async function ConfirmLinkPage({ searchParams }: Props) {
  const { attempt, token_hash: tokenHash } = await searchParams;

  return (
    <SignedOutFrame>
      <ConfirmLink attempt={attempt} tokenHash={tokenHash} />
    </SignedOutFrame>
  );
}
