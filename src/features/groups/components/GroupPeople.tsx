"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { Person } from "../types";
import AddMemberForm from "./AddMemberForm";
import GroupMemberRow from "./GroupMemberRow";

type Props = { groupId: string; members: Person[]; others: Person[] }; // others: who can be added

// Who in the app is in a group, each with Remove, and adding someone. On the group's editor screen.
export default function GroupPeople({ groupId, members, others }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>{t(STRINGS.peopleHeading)}</SectionHeading>
      {members.length === 0 && <Text tone="subtle">{t(STRINGS.nobodyYet)}</Text>}
      <ul>
        {members.map((person) => (
          <GroupMemberRow key={person.user_id} groupId={groupId} person={person} />
        ))}
      </ul>
      <AddMemberForm groupId={groupId} people={others} />
    </section>
  );
}
