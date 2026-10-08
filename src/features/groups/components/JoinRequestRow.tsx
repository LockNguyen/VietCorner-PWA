"use client";

import { useState } from "react";
import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { approveJoinRequest, declineJoinRequest } from "../api";
import { STRINGS } from "../strings";
import type { JoinRequest } from "../types";

type Props = { request: JoinRequest; groupName: string | undefined };

// One person waiting to join one group, with the two answers a manager can give.
// A row of its own, so answering one request never blocks the requests around it.
export default function JoinRequestRow({ request, groupName }: Props) {
  const refresh = useRefresh();
  const { t } = useLanguage(); // I18N
  const [failed, setFailed] = useState(false);
  const { pending, run } = usePending<"approve" | "decline">();

  function answer(action: "approve" | "decline", decide: (groupId: string, userId: string) => Promise<void>) {
    return run(action, async () => {
      setFailed(false);
      try {
        await decide(request.group_id, request.user_id);
        await refresh(); // the answered request has left the list before its buttons stop looking busy
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <li className="rounded border p-3">
      <p className="text-lg break-words">{request.user_email}</p>
      <p className="text-sm text-gray-500">{groupName}</p>
      <div className="mt-2 flex gap-2">
        <ActionButton
          pending={pending === "approve"}
          disabled={pending !== null}
          onClick={() => answer("approve", approveJoinRequest)}
          className="flex-1 rounded bg-blue-500 p-2 text-lg text-white"
        >
          {t(STRINGS.approve)}
        </ActionButton>
        <ActionButton
          pending={pending === "decline"}
          disabled={pending !== null}
          onClick={() => answer("decline", declineJoinRequest)}
          className="flex-1 rounded border p-2 text-lg"
        >
          {t(STRINGS.decline)}
        </ActionButton>
      </div>
      {failed && <p className="mt-2 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </li>
  );
}
