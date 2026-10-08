"use client";

import ActionButton from "@/components/ui/ActionButton";
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
    <li className="rounded border p-3">
      <p className="text-lg break-words">{request.user_email}</p>
      <p className="text-sm text-gray-500">{groupName}</p>
      <div className="mt-2 flex gap-2">
        <ActionButton
          pending={pending === "approve"}
          disabled={pending !== null}
          onClick={() => save("approve", () => approveJoinRequest(groupId, userId), { done: t(STRINGS.approved), failed })}
          className="flex-1 rounded bg-blue-500 p-2 text-lg text-white"
        >
          {t(STRINGS.approve)}
        </ActionButton>
        <ActionButton
          pending={pending === "decline"}
          disabled={pending !== null}
          onClick={() => save("decline", () => declineJoinRequest(groupId, userId), { done: t(STRINGS.declined), failed })}
          className="flex-1 rounded border p-2 text-lg"
        >
          {t(STRINGS.decline)}
        </ActionButton>
      </div>
    </li>
  );
}
