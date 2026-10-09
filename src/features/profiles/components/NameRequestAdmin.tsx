"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getNameRequests } from "../api";
import { useNames } from "../hooks/useNames";
import { STRINGS } from "../strings";
import type { NameRequest, Names } from "../types";
import NameRequestRow from "./NameRequestRow";

type Props = { requests: NameRequest[]; names: Names }; // as the page loaded them; names: what each is called now

// The admin page's section for names: everyone who asked to be called something else, longest wait first;
// nothing at all when nobody is waiting. Reads itself again on every arrival, like the join requests.
export default function NameRequestAdmin({ requests: loaded, names: loadedNames }: Props) {
  const { t } = useLanguage(); // I18N
  const requests = useFresh(loaded, getNameRequests);
  const names = useNames(requests.map((request) => request.user_id), loadedNames);
  if (requests.length === 0) return null;

  return (
    <section>
      <SectionHeading>{t(STRINGS.namesWaiting)}</SectionHeading>
      <ul>
        {requests.map((request) => (
          <NameRequestRow key={request.user_id} request={request} currentName={names[request.user_id]} />
        ))}
      </ul>
    </section>
  );
}
