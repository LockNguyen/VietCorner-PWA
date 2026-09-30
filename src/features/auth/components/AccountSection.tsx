"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import SignOutButton from "./SignOutButton";

// Settings block: who is signed in, and a way out. A Client Component so it can read the language;
// it has a client child anyway.
export default function AccountSection({ email }: { email: string }) {
  const { t } = useLanguage(); // I18N

  return (
    <section className="space-y-3 border-b p-4">
      <p>{t(STRINGS.signedInAs)} <b>{email}</b></p>
      <SignOutButton />
    </section>
  );
}
