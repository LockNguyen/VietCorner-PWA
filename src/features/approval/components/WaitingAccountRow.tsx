"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { approveAccount } from "../api";
import { STRINGS } from "../strings";
import type { WaitingAccount } from "../types";

// One person waiting, with the email the account signed in with, and the button that lets them in.
// A row of its own, so approving one never blocks the others.
export default function WaitingAccountRow({ account }: { account: WaitingAccount }) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"approve">();
  const says = { done: t(STRINGS.approved), failed: t(COMMON.couldNotSave) };

  return (
    <ListRow
      title={account.name}
      subtitle={account.email}
      trailing={
        <Button pending={pending === "approve"} onClick={() => save("approve", () => approveAccount(account.user_id), says)}>
          {t(STRINGS.approve)}
        </Button>
      }
    />
  );
}
