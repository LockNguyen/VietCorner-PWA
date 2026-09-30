import { STRINGS } from "../strings";
import SignOutButton from "./SignOutButton";

// Settings block: shows who is signed in, with a sign-out button.
export default function AccountSection({ email }: { email: string }) {
  return (
    <section className="space-y-3 border-b p-4">
      <p>{STRINGS.signedInAs} <b>{email}</b></p>
      <SignOutButton />
    </section>
  );
}
