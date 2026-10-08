"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import SignOutButton from "./SignOutButton";

// Settings block: who is signed in, and a way out.
export default function AccountSection({ email }: { email: string }) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading>{t(STRINGS.accountHeading)}</SectionHeading>
      <ul>
        <ListRow title={email} subtitle={t(STRINGS.signedInAs)} />
      </ul>
      <div className="flex flex-col p-3">
        <SignOutButton />
      </div>
    </section>
  );
}
