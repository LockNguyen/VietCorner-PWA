"use client";

import { UserRoundX } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFresh } from "@/lib/useFresh";
import { getGroupPeople } from "../api";
import { members, STRINGS } from "../strings";
import type { Person } from "../types";
import UnassignedSheet from "./UnassignedSheet";

// The last card on the Groups tab, for an admin: everyone in the app who is in no group yet (where a newly
// approved person starts). Opens the list of them. Reads itself again on arrival: a kept Groups tab must not
// list someone an admin has just put into a group.
export default function UnassignedCard({ people: loaded }: { people: Person[] }) {
  const { t } = useLanguage(); // I18N
  const people = useFresh(loaded, getGroupPeople).filter((person) => person.group_ids.length === 0);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        placeholder={<UserRoundX className="size-8" />}
        title={t(STRINGS.noGroup)}
        subtitle={t(members(people.length))}
        onClick={() => setOpen(true)}
      />
      {open && <UnassignedSheet people={people} onClose={() => setOpen(false)} />}
    </>
  );
}
