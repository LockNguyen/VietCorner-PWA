"use client";

import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { removeGroup } from "../api";
import { STRINGS } from "../strings";
import type { Group, Person } from "../types";
import AddMemberForm from "./AddMemberForm";
import GroupDetailsForm from "./GroupDetailsForm";
import GroupMemberRow from "./GroupMemberRow";
import GroupThumbnail from "./GroupThumbnail";

type Props = {
  group: Group;
  members: Person[]; // who is in it
  others: Person[]; // everyone else: who can be added
  onClose: () => void;
};

// Everything an admin does to one group, in a sheet over the admin page: its picture, its name and size,
// who is in it, adding someone, and last the red button that removes the group.
export default function GroupSheet({ group, members, others, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"remove">();
  const says = { done: t(COMMON.removed), failed: t(COMMON.couldNotSave) };

  return (
    <Sheet title={group.name} closeLabel={t(COMMON.close)} onClose={onClose}>
      <GroupThumbnail group={group} />
      <GroupDetailsForm group={group} />

      <SectionHeading>{t(STRINGS.peopleHeading)}</SectionHeading>
      {members.length === 0 && <Text tone="subtle">{t(STRINGS.nobodyYet)}</Text>}
      <ul>
        {members.map((person) => (
          <GroupMemberRow key={person.user_id} groupId={group.id} person={person} />
        ))}
      </ul>
      <AddMemberForm groupId={group.id} people={others} />

      {/* No "are you sure?" (decided: fewer taps): the group is kept in the database, where a mistake is undone. */}
      <Button variant="danger" pending={pending === "remove"} onClick={() => save("remove", () => removeGroup(group.id), says)}>
        {t(STRINGS.removeGroup)}
      </Button>
    </Sheet>
  );
}
