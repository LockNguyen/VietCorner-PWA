import EmailConfirmed from "@/features/auth/components/EmailConfirmed";
import SignedOutFrame from "@/features/auth/components/SignedOutFrame";

// Where a new account's email link lands after Supabase has confirmed the address. Under `/login`, so the
// proxy lets a signed-out browser reach it. It changes nothing: the app that asked signs in by itself.
export default function EmailConfirmedPage() {
  return (
    <SignedOutFrame>
      <EmailConfirmed />
    </SignedOutFrame>
  );
}
