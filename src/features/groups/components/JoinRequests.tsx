"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useNames } from "@/features/profiles/hooks/useNames"; // PROFILES
import type { Names } from "@/features/profiles/types"; // PROFILES
import { useFresh } from "@/lib/useFresh";
import { getJoinRequests } from "../api";
import { STRINGS } from "../strings";
import type { Group, JoinRequest } from "../types";
import JoinRequestRow from "./JoinRequestRow";

type Props = { requests: JoinRequest[]; groups: Group[]; names: Names }; // as the page loaded them

// Everyone waiting to be let into a group, longest wait first; nothing at all when nobody is waiting.
// Reads itself again on every arrival: a manager must never look at an old list of who is waiting.
export default function JoinRequests({ requests: loaded, groups, names: loadedNames }: Props) {
  const { t } = useLanguage(); // I18N
  const requests = useFresh(loaded, getJoinRequests);
  const names = useNames(requests.map((request) => request.user_id), loadedNames); // PROFILES: whoever is new
  if (requests.length === 0) return null;

  return (
    <>
      <SectionHeading>{t(STRINGS.requestsHeading)}</SectionHeading>
      <ul>
        {requests.map((request) => (
          <JoinRequestRow
            key={`${request.group_id}-${request.user_id}`}
            request={request}
            name={names[request.user_id]}
            groupName={groups.find((group) => group.id === request.group_id)?.name}
          />
        ))}
      </ul>
    </>
  );
}
