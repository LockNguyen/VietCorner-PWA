"use client";

import { Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import TextInput from "@/components/ui/TextInput";
import Thumbnail from "@/components/ui/Thumbnail";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Names } from "@/features/profiles/types"; // PROFILES
import { publicFileUrl } from "@/lib/publicFileUrl";
import { SWITCHES } from "@/lib/switches";
import { useFresh } from "@/lib/useFresh";
import { useSave } from "@/lib/useSave";
import { createGroup, getGroupPeople, getMyGroups } from "../api";
import { members, STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH, THUMBNAIL_BUCKET, type Group, type JoinRequest, type Person } from "../types";
import GroupSheet from "./GroupSheet";
import JoinRequests from "./JoinRequests";
import UnassignedSheet from "./UnassignedSheet";

type Props = {
  groups: Group[]; // as the page loaded them
  people: Person[]; // as the page loaded them: everyone who may use the app, with the groups they are in
  requests: JoinRequest[];
  names: Names; // of the people in `requests`
};

// Which sheet is open: a group's (by id), the one for people in no group, or none.
const UNASSIGNED = "unassigned";

// The admin page's section for groups: each group with how many people it has, opening a sheet to manage
// it; last, everyone who is in no group yet; then the box that adds a group.
// Shown only to someone with the "groups.manage" permission; the database refuses everyone else anyway.
// Groups and people read themselves again on every arrival: a kept copy of the Admin page must not show
// who was in which group ten minutes ago, least of all someone approved since.
export default function GroupAdmin({ groups: loadedGroups, people: loadedPeople, requests, names }: Props) {
  const { t } = useLanguage(); // I18N
  const groups: Group[] = useFresh(loadedGroups, getMyGroups);
  const people = useFresh(loadedPeople, getGroupPeople);
  const [name, setName] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { pending, save } = useSave<"add">();

  const inGroup = (groupId: string) => people.filter((person) => person.group_ids.includes(groupId));
  const unassigned = people.filter((person) => person.group_ids.length === 0);
  // Found again on every render, so the sheet shows the page's newest data and closes if its group is removed.
  const openGroup = groups.find((group) => group.id === open);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };
    if (await save("add", () => createGroup(name.trim()), says)) setName("");
  }

  return (
    <section>
      {SWITCHES.joining && <JoinRequests requests={requests} groups={groups} names={names} />}

      <SectionHeading>{t(STRINGS.adminHeading)}</SectionHeading>
      <ul>
        {groups.map((group) => (
          <ListRow
            key={group.id}
            leading={
              <Thumbnail src={group.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, group.thumbnail_path) : undefined}>
                <Users />
              </Thumbnail>
            }
            title={group.name}
            // The typed number when there is one; until then, the accounts in the group.
            subtitle={t(members(group.member_count ?? inGroup(group.id).length))}
            onClick={() => setOpen(group.id)}
          />
        ))}
        <ListRow title={t(STRINGS.noGroup)} subtitle={t(members(unassigned.length))} onClick={() => setOpen(UNASSIGNED)} />
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-6">
        <Field label={t(STRINGS.newGroupField)}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX_GROUP_NAME_LENGTH} />
        </Field>
        <Button variant="quiet" pending={pending === "add"} disabled={name.trim() === ""}>
          {t(STRINGS.addGroup)}
        </Button>
      </form>

      {openGroup && (
        <GroupSheet
          key={openGroup.id}
          group={openGroup}
          members={inGroup(openGroup.id)}
          others={people.filter((person) => !person.group_ids.includes(openGroup.id))}
          onClose={() => setOpen(null)}
        />
      )}
      {open === UNASSIGNED && <UnassignedSheet people={unassigned} onClose={() => setOpen(null)} />}
    </section>
  );
}
