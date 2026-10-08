"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { approveNameRequest, declineNameRequest } from "../api";
import { STRINGS } from "../strings";
import type { NameRequest } from "../types";

type Props = { request: NameRequest; currentName: string | undefined };

// One requested name, with the email the account signed in with and the name in use now, and the two
// answers a manager can give. A row of its own, so answering one never blocks the others.
export default function NameRequestRow({ request, currentName }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"approve" | "decline">();
  const failed = t(COMMON.couldNotSave);

  return (
    <ListRow
      title={`${request.name} (${request.user_email})`}
      subtitle={`${t(STRINGS.currentName)}: ${currentName ?? ""}`}
      trailing={
        <>
          <Button
            pending={pending === "approve"}
            disabled={pending !== null}
            onClick={() => save("approve", () => approveNameRequest(request.user_id), { done: t(STRINGS.approved), failed })}
          >
            {t(STRINGS.approve)}
          </Button>
          <Button
            variant="quiet"
            pending={pending === "decline"}
            disabled={pending !== null}
            onClick={() => save("decline", () => declineNameRequest(request.user_id), { done: t(STRINGS.declined), failed })}
          >
            {t(STRINGS.decline)}
          </Button>
        </>
      }
    />
  );
}
