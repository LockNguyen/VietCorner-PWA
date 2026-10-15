"use client";

import ListRow from "@/components/ui/ListRow";
import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { Person } from "../types";
import { COMMON } from "@/features/i18n/common"; // I18N

// Everyone who is in no group yet, which is where a newly approved person starts: name over email.
// Only a list: a person is put into a group from that group's sheet.
export default function UnassignedSheet({ people, onClose }: { people: Person[]; onClose: () => void }) {
  const { t } = useLanguage(); // I18N

  return (
    <Sheet title={t(STRINGS.noGroup)} closeLabel={t(COMMON.close)} onClose={onClose}>
      {people.length === 0 && <Text tone="subtle">{t(STRINGS.nobodyYet)}</Text>}
      <ul>
        {people.map((person) => (
          <ListRow key={person.user_id} title={person.name} subtitle={person.email} />
        ))}
      </ul>
    </Sheet>
  );
}
