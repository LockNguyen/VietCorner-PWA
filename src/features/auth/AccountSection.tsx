import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

// Settings block: shows who is signed in, with a sign-out button.
export default async function AccountSection() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <section className="space-y-3 border-b p-4">
      <p>Signed in as <b>{data.user?.email}</b></p>
      <SignOutButton />
    </section>
  );
}
