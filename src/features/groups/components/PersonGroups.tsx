"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import Switch from "@/components/ui/Switch";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { addMember, removeMember } from "../api";
import { STRINGS } from "../strings";
import type { Group } from "../types";

type Props = { userId: string; groups: Group[]; memberOf: string[] }; // memberOf: the ids of their groups

// Which groups one person is in: a switch per group, each saving at once. On the person's screen (Admin).
export default function PersonGroups({ userId, groups, memberOf }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<string>();
  const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };

  return (
    <section className="flex flex-col">
      <SectionHeading>{t(STRINGS.adminHeading)}</SectionHeading>
      <div className="flex flex-col px-3">
        {groups.map((group) => (
          <Switch
            key={group.id}
            label={group.name}
            checked={memberOf.includes(group.id)}
            disabled={pending !== null}
            onChange={(event) => {
              const inIt = event.target.checked; // read now: the event object is reused after this handler
              save(group.id, () => (inIt ? addMember(group.id, userId) : removeMember(group.id, userId)), says);
            }}
          />
        ))}
      </div>
    </section>
  );
}
