"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { NameRequest, Names } from "../types";
import NameRequestRow from "./NameRequestRow";

type Props = { requests: NameRequest[]; names: Names }; // names: what each person is called now

// The admin page's section for names: everyone who asked to be called something else, longest wait first.
// Renders nothing when nobody is waiting, so the admin page stays short.
export default function NameRequestAdmin({ requests, names }: Props) {
  const { t } = useLanguage(); // I18N
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
