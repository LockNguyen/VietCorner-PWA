"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getWaitingAccounts } from "../api";
import { STRINGS } from "../strings";
import type { WaitingAccount } from "../types";
import WaitingAccountRow from "./WaitingAccountRow";

// The admin page's section for new accounts: everyone waiting to be let in, longest wait first; nothing at
// all when nobody is. Reads itself again on every arrival, so a kept copy of the page never shows an old list.
export default function WaitingAccounts({ accounts: loaded }: { accounts: WaitingAccount[] }) {
  const { t } = useLanguage(); // I18N
  const accounts = useFresh(loaded, getWaitingAccounts);
  if (accounts.length === 0) return null;

  return (
    <section>
      <SectionHeading>{t(STRINGS.accountsWaiting)}</SectionHeading>
      <ul>
        {accounts.map((account) => (
          <WaitingAccountRow key={account.user_id} account={account} />
        ))}
      </ul>
    </section>
  );
}
