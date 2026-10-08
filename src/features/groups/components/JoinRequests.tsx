"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Names } from "@/features/profiles/types"; // PROFILES
import { STRINGS } from "../strings";
import type { Group, JoinRequest } from "../types";
import JoinRequestRow from "./JoinRequestRow";

type Props = { requests: JoinRequest[]; groups: Group[]; names: Names };

// Everyone waiting to be let into a group, longest wait first.
// Renders nothing when nobody is waiting, so the admin page stays short.
export default function JoinRequests({ requests, groups, names }: Props) {
  const { t } = useLanguage(); // I18N
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
