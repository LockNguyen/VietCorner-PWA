"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { approveJoinRequest, declineJoinRequest } from "../api";
import { STRINGS } from "../strings";
import type { Group, JoinRequest } from "../types";

type Props = { requests: JoinRequest[]; groups: Group[] };

// Everyone waiting to be let into a group, longest wait first, with the two answers a manager can give.
// Renders nothing when nobody is waiting, so the admin page stays short.
export default function JoinRequests({ requests, groups }: Props) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [failed, setFailed] = useState(false);

  async function answer(decide: () => Promise<void>) {
    setFailed(false);
    try {
      await decide();
      router.refresh(); // reload the page's server data: the answered request leaves the list
    } catch {
      setFailed(true);
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-1 font-semibold">{t(STRINGS.requestsHeading)}</h3>
      <ul className="space-y-2">
        {requests.map((request) => (
          <li key={`${request.group_id}-${request.user_id}`} className="rounded border p-3">
            <p className="text-lg break-words">{request.user_email}</p>
            <p className="text-sm text-gray-500">{groups.find((group) => group.id === request.group_id)?.name}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => answer(() => approveJoinRequest(request.group_id, request.user_id))}
                className="flex-1 rounded bg-blue-500 p-2 text-lg text-white"
              >
                {t(STRINGS.approve)}
              </button>
              <button
                onClick={() => answer(() => declineJoinRequest(request.group_id, request.user_id))}
                className="flex-1 rounded border p-2 text-lg"
              >
                {t(STRINGS.decline)}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {failed && <p className="mt-2 text-red-600">{t(STRINGS.couldNotSave)}</p>}
    </div>
  );
}
