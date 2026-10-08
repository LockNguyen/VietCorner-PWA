"use client";

import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { Group, JoinRequest } from "../types";
import JoinRequestRow from "./JoinRequestRow";

type Props = { requests: JoinRequest[]; groups: Group[] };

// Everyone waiting to be let into a group, longest wait first.
// Renders nothing when nobody is waiting, so the admin page stays short.
export default function JoinRequests({ requests, groups }: Props) {
  const { t } = useLanguage(); // I18N
  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-1 font-semibold">{t(STRINGS.requestsHeading)}</h3>
      <ul className="space-y-2">
        {requests.map((request) => (
          <JoinRequestRow
            key={`${request.group_id}-${request.user_id}`}
            request={request}
            groupName={groups.find((group) => group.id === request.group_id)?.name}
          />
        ))}
      </ul>
    </div>
  );
}
