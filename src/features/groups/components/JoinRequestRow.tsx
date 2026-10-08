"use client";

import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { approveJoinRequest, declineJoinRequest } from "../api";
import { STRINGS } from "../strings";
import type { JoinRequest } from "../types";

type Props = { request: JoinRequest; groupName: string | undefined };

// One person waiting to join one group, with the two answers a manager can give.
// A row of its own, so answering one request never blocks the requests around it.
export default function JoinRequestRow({ request, groupName }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"approve" | "decline">();
  const failed = t(STRINGS.couldNotSave);
  const { group_id: groupId, user_id: userId } = request;

  return (
    <ListRow
      title={request.user_email}
      subtitle={groupName}
      trailing={
        <>
          <Button
            pending={pending === "approve"}
            disabled={pending !== null}
            onClick={() => save("approve", () => approveJoinRequest(groupId, userId), { done: t(STRINGS.approved), failed })}
          >
            {t(STRINGS.approve)}
          </Button>
          <Button
            variant="quiet"
            pending={pending === "decline"}
            disabled={pending !== null}
            onClick={() => save("decline", () => declineJoinRequest(groupId, userId), { done: t(STRINGS.declined), failed })}
          >
            {t(STRINGS.decline)}
          </Button>
        </>
      }
    />
  );
}
