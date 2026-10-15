"use client";

import { UserRoundX } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { members, STRINGS } from "../strings";
import type { Person } from "../types";
import UnassignedSheet from "./UnassignedSheet";

// The last card on the Groups tab, for an admin: everyone in the app who is in no group yet (where a newly
// approved person starts). Opens the list of them.
export default function UnassignedCard({ people }: { people: Person[] }) {
  const { t } = useLanguage(); // I18N
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
